import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApInvoice } from '../entities/ap-invoice.entity';
import { ApInvoiceItem } from '../entities/ap-invoice-item.entity';
import { Purchase } from '../entities/purchase.entity';
import { PurchaseItems } from '../entities/purchase-item.entity';
import { UOM } from '../entities/uom.entity';
import { GrnItem } from '../entities/grn-item.entity';
import { CreateApInvoiceDto } from './dto/create-ap-invoice.dto';
import { UpdateApInvoiceDto } from './dto/update-ap-invoice.dto';

@Injectable()
export class ApInvoiceService {
  constructor(
    @InjectRepository(ApInvoice)
    private readonly invoiceRepo: Repository<ApInvoice>,
    @InjectRepository(ApInvoiceItem)
    private readonly itemRepo: Repository<ApInvoiceItem>,
    @InjectRepository(Purchase)
    private readonly purchaseRepo: Repository<Purchase>,
    @InjectRepository(PurchaseItems)
    private readonly purchaseItemRepo: Repository<PurchaseItems>,
    @InjectRepository(UOM)
    private readonly uomRepo: Repository<UOM>,
    @InjectRepository(GrnItem)
    private readonly grnItemRepo: Repository<GrnItem>,
  ) {}

  private async generateSeries(): Promise<string> {
    const last = await this.invoiceRepo
      .createQueryBuilder('i')
      .where('i.series LIKE :p', { p: 'AP-%' })
      .orderBy('i.createdAt', 'DESC')
      .getOne();
    let n = 1;
    if (last?.series) {
      const m = last.series.match(/^AP-(\d+)$/);
      if (m) n = parseInt(m[1], 10) + 1;
    }
    return `AP-${String(n).padStart(4, '0')}`;
  }

  private async sumReceivedBase(purchaseItemId: string): Promise<number> {
    type RawResult = { total?: string | number } | undefined;
    const r: RawResult = await this.grnItemRepo
      .createQueryBuilder('gi')
      .select('SUM(gi.baseQuantityReceived)', 'total')
      .where('gi.purchaseItemId = :id', { id: purchaseItemId })
      .getRawOne();
    const total = r?.total;
    return parseFloat(typeof total === 'string' ? total : String(total || '0'));
  }

  private async sumInvoicedBase(purchaseItemId: string): Promise<number> {
    type RawResult = { total?: string | number } | undefined;
    const r: RawResult = await this.itemRepo
      .createQueryBuilder('ai')
      .select('SUM(ai.baseQuantity)', 'total')
      .where('ai.purchaseItemId = :id', { id: purchaseItemId })
      .getRawOne();
    const total = r?.total;
    return parseFloat(typeof total === 'string' ? total : String(total || '0'));
  }

  async create(dto: CreateApInvoiceDto): Promise<ApInvoice> {
    if (dto.purchaseId) {
      const exists = await this.purchaseRepo.findOne({
        where: { id: dto.purchaseId },
      });
      if (!exists) throw new NotFoundException('Purchase not found');
    }

    // Validate unique supplierInvoiceNumber per supplier
    if (dto.supplierInvoiceNumber) {
      const existing = await this.invoiceRepo.findOne({
        where: {
          supplierId: dto.supplierId,
          supplierInvoiceNumber: dto.supplierInvoiceNumber,
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Supplier invoice number "${dto.supplierInvoiceNumber}" already exists for this supplier`,
        );
      }
    }

    const series = dto.series ?? (await this.generateSeries());

    // Preload purchase items and UOMs
    const purchaseItemIds = Array.from(
      new Set(dto.items.map((i) => i.purchaseItemId)),
    );
    const purchaseItems =
      await this.purchaseItemRepo.findByIds(purchaseItemIds);
    const byId = new Map(purchaseItems.map((p) => [p.id, p]));
    const uomIds = Array.from(
      new Set(dto.items.flatMap((i) => [i.uomId, i.baseUomId])),
    );
    const uoms = await this.uomRepo.findByIds(uomIds);
    const uomById = new Map(uoms.map((u) => [u.id, u]));

    const errors: Record<string, string> = {};
    let totalAmount = 0;
    const itemsToSave: ApInvoiceItem[] = [];

    for (let idx = 0; idx < dto.items.length; idx++) {
      const it = dto.items[idx];
      const pi = byId.get(it.purchaseItemId);
      if (!pi) {
        errors[`items[${idx}].purchaseItemId`] = 'Invalid purchaseItemId';
        continue;
      }

      const uom = uomById.get(it.uomId);
      const baseUom = uomById.get(it.baseUomId);
      if (!uom) errors[`items[${idx}].uomId`] = 'Invalid uomId';
      if (!baseUom) errors[`items[${idx}].baseUomId`] = 'Invalid baseUomId';
      if (uom && baseUom) {
        if (uom.unitCategoryId !== baseUom.unitCategoryId) {
          errors[`items[${idx}].uomId`] = 'UOMs must be in same unit category';
        }
        if (!baseUom.baseUnit) {
          errors[`items[${idx}].baseUomId`] =
            'Base UOM must be category base unit';
        }
      }

      if (Object.keys(errors).length) continue;

      const unit =
        Number(uom!.conversionRate) / Number(baseUom!.conversionRate);
      const baseQuantity = it.quantity * unit;

      // 3-way match: invoiced ≤ received and ≤ ordered
      const received = await this.sumReceivedBase(pi.id);
      const alreadyInvoiced = await this.sumInvoicedBase(pi.id);
      const ordered = pi.baseQuantity;
      if (alreadyInvoiced + baseQuantity > received) {
        errors[`items[${idx}].quantity`] =
          `Invoiced (${alreadyInvoiced + baseQuantity}) exceeds received (${received})`;
      }
      if (alreadyInvoiced + baseQuantity > ordered) {
        errors[`items[${idx}].quantity`] =
          `Invoiced (${alreadyInvoiced + baseQuantity}) exceeds ordered (${ordered})`;
      }

      // Price tolerance validation (allow 2% variance from PO price)
      const poUnitPrice = pi.unitPrice;
      const priceVariance = Math.abs(it.unitPrice - poUnitPrice) / poUnitPrice;
      const PRICE_TOLERANCE = 0.02; // 2%
      if (priceVariance > PRICE_TOLERANCE) {
        errors[`items[${idx}].unitPrice`] =
          `Price variance (${(priceVariance * 100).toFixed(2)}%) exceeds tolerance (${(PRICE_TOLERANCE * 100).toFixed(0)}%). PO price: ${poUnitPrice}, Invoice price: ${it.unitPrice}`;
      }

      const amount = it.unitPrice * it.quantity;
      totalAmount += amount;
      itemsToSave.push(
        this.itemRepo.create({
          purchaseItemId: it.purchaseItemId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          amount,
          uomId: it.uomId,
          baseUomId: it.baseUomId,
          unit,
          baseQuantity,
        }),
      );
    }

    if (Object.keys(errors).length) {
      throw new BadRequestException({ message: 'Validation failed', errors });
    }

    // Compute dueDate from invoiceDate + paymentTerms
    const invoiceDate = dto.invoiceDate
      ? new Date(dto.invoiceDate)
      : new Date();
    let dueDate: Date | null = null;
    if (dto.paymentTerms && invoiceDate) {
      dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + Number(dto.paymentTerms));
    }

    const header = this.invoiceRepo.create({
      series,
      supplierId: dto.supplierId,
      purchaseId: dto.purchaseId ?? null,
      invoiceDate: invoiceDate || null,
      reference: dto.reference ?? null,
      note: dto.note ?? null,
      supplierInvoiceNumber: dto.supplierInvoiceNumber ?? null,
      paymentTerms: dto.paymentTerms ?? null,
      dueDate,
      status: dto.status ?? 'DRAFT',
      totalAmount,
      paidAmount: 0,
      outstandingAmount: totalAmount,
    });
    const saved = await this.invoiceRepo.save(header);
    for (const it of itemsToSave) {
      it.invoiceId = saved.id;
    }
    if (itemsToSave.length) await this.itemRepo.save(itemsToSave);
    const full = await this.invoiceRepo.findOne({
      where: { id: saved.id },
      relations: ['items'],
    });
    if (!full) throw new NotFoundException('AP invoice not found after create');
    return full;
  }

  async findAll(
    page = 1,
    limit = 20,
    q?: string,
  ): Promise<{ data: ApInvoice[]; total: number }> {
    const qb = this.invoiceRepo.createQueryBuilder('i');
    if (q) {
      qb.where('LOWER(i.series) LIKE :q OR LOWER(i.reference) LIKE :q', {
        q: `%${q.toLowerCase()}%`,
      });
    }
    qb.leftJoinAndSelect('i.items', 'items')
      .orderBy('i.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<ApInvoice> {
    const row = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!row) throw new NotFoundException('AP invoice not found');
    return row;
  }

  async getOutstanding(id: string): Promise<{
    invoiceId: string;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
  }> {
    const invoice = await this.findOne(id);
    return {
      invoiceId: invoice.id,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      outstandingAmount: invoice.outstandingAmount,
    };
  }

  async update(id: string, dto: UpdateApInvoiceDto): Promise<ApInvoice> {
    const header = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!header) throw new NotFoundException('AP invoice not found');

    await this.invoiceRepo.update(
      { id },
      {
        ...(dto.series !== undefined ? { series: dto.series } : {}),
        ...(dto.supplierId !== undefined ? { supplierId: dto.supplierId } : {}),
        ...(dto.purchaseId !== undefined ? { purchaseId: dto.purchaseId } : {}),
        ...(dto.invoiceDate !== undefined
          ? { invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : null }
          : {}),
        ...(dto.reference !== undefined
          ? { reference: dto.reference ?? null }
          : {}),
        ...(dto.note !== undefined ? { note: dto.note ?? null } : {}),
      },
    );

    if (dto.items) {
      // Delete existing items
      await this.itemRepo
        .createQueryBuilder()
        .delete()
        .where('invoiceId = :invoiceId', { invoiceId: id })
        .execute();

      // Preload for validation
      const purchaseItemIds = Array.from(
        new Set(dto.items.map((i) => i.purchaseItemId)),
      );
      const purchaseItems =
        await this.purchaseItemRepo.findByIds(purchaseItemIds);
      const byId = new Map(purchaseItems.map((p) => [p.id, p]));
      const uomIds = Array.from(
        new Set(dto.items.flatMap((i) => [i.uomId, i.baseUomId])),
      );
      const uoms = await this.uomRepo.findByIds(uomIds);
      const uomById = new Map(uoms.map((u) => [u.id, u]));

      const errors: Record<string, string> = {};
      let totalAmount = 0;
      const itemsToSave: ApInvoiceItem[] = [];

      for (let idx = 0; idx < dto.items.length; idx++) {
        const it = dto.items[idx];
        const pi = byId.get(it.purchaseItemId);
        if (!pi) {
          errors[`items[${idx}].purchaseItemId`] = 'Invalid purchaseItemId';
          continue;
        }
        const uom = uomById.get(it.uomId);
        const baseUom = uomById.get(it.baseUomId);
        if (!uom) errors[`items[${idx}].uomId`] = 'Invalid uomId';
        if (!baseUom) errors[`items[${idx}].baseUomId`] = 'Invalid baseUomId';
        if (uom && baseUom) {
          if (uom.unitCategoryId !== baseUom.unitCategoryId) {
            errors[`items[${idx}].uomId`] =
              'UOMs must be in same unit category';
          }
          if (!baseUom.baseUnit) {
            errors[`items[${idx}].baseUomId`] =
              'Base UOM must be category base unit';
          }
        }
        if (Object.keys(errors).length) continue;

        const unit =
          Number(uom!.conversionRate) / Number(baseUom!.conversionRate);
        const baseQuantity = it.quantity * unit;

        const received = await this.sumReceivedBase(pi.id);
        const alreadyInvoiced = await this.sumInvoicedBase(pi.id);
        const ordered = pi.baseQuantity;
        if (alreadyInvoiced + baseQuantity > received) {
          errors[`items[${idx}].quantity`] =
            `Invoiced (${alreadyInvoiced + baseQuantity}) exceeds received (${received})`;
        }
        if (alreadyInvoiced + baseQuantity > ordered) {
          errors[`items[${idx}].quantity`] =
            `Invoiced (${alreadyInvoiced + baseQuantity}) exceeds ordered (${ordered})`;
        }

        const amount = it.unitPrice * it.quantity;
        totalAmount += amount;
        itemsToSave.push(
          this.itemRepo.create({
            invoiceId: id,
            purchaseItemId: it.purchaseItemId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            amount,
            uomId: it.uomId,
            baseUomId: it.baseUomId,
            unit,
            baseQuantity,
          }),
        );
      }

      if (Object.keys(errors).length) {
        throw new BadRequestException({ message: 'Validation failed', errors });
      }
      if (itemsToSave.length) await this.itemRepo.save(itemsToSave);

      // Recompute total
      await this.invoiceRepo.update({ id }, { totalAmount });
    }

    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const row = await this.findOne(id);
    await this.itemRepo
      .createQueryBuilder()
      .delete()
      .where('invoiceId = :id', { id })
      .execute();
    await this.invoiceRepo.remove(row);
  }
}
