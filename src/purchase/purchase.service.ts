import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase } from '../entities/purchase.entity';
import { PurchaseItems } from '../entities/purchase-item.entity';
import { Product } from '../entities/product.entity';
import { UOM } from '../entities/uom.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchaseRepository: Repository<Purchase>,
    @InjectRepository(PurchaseItems)
    private readonly purchaseItemRepository: Repository<PurchaseItems>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(UOM)
    private readonly uomRepository: Repository<UOM>,
  ) {}

  private async generateSeries(): Promise<string> {
    // Find the last purchase with series matching PO-XXXX pattern
    const lastPurchase = await this.purchaseRepository
      .createQueryBuilder('p')
      .where('p.series LIKE :pattern', { pattern: 'PO-%' })
      .orderBy('p.createdAt', 'DESC')
      .getOne();

    let nextNumber = 1;

    if (lastPurchase && lastPurchase.series) {
      // Extract the number from the series (e.g., "PO-0001" -> 1)
      const match = lastPurchase.series.match(/^PO-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Format with leading zeros (4 digits): PO-0001, PO-0002, etc.
    return `PO-${nextNumber.toString().padStart(4, '0')}`;
  }

  async create(dto: CreatePurchaseDto): Promise<Purchase> {
    // Generate series if not provided
    const series = dto.series ?? (await this.generateSeries());

    const purchase = this.purchaseRepository.create({
      series,
      supplierId: dto.supplierId,
      status: dto.status,
      orderDate: dto.orderDate ? new Date(dto.orderDate) : undefined,
      paymentMethod: dto.paymentMethod,
      reference: dto.reference ?? '',
      note: dto.note ?? undefined,
      purchaserId: dto.purchaserId ?? undefined,
      amount: 0,
      totalAmount: 0,
      totalQuantity: 0,
    });
    const saved = await this.purchaseRepository.save(purchase);

    // Build items and compute totals
    let totalAmount = 0;
    let totalQty = 0;
    const items: PurchaseItems[] = [];
    // Preload referenced products and UOMs for validation
    const productIds = Array.from(
      new Set((dto.items ?? []).map((i) => i.productId)),
    );
    const uomIds = Array.from(
      new Set(
        (dto.items ?? [])
          .flatMap((i) => [i.uomId, i.baseUomId])
          .filter((v): v is string => typeof v === 'string'),
      ),
    );
    const products = await this.productRepository.findByIds(productIds);
    const productById = new Map(products.map((p) => [p.id, p]));
    const uoms = await this.uomRepository.findByIds(uomIds);
    const uomById = new Map(uoms.map((u) => [u.id, u]));

    const errors: Record<string, string> = {};

    for (let idx = 0; idx < (dto.items?.length ?? 0); idx++) {
      const it = (dto.items ?? [])[idx];
      const product = productById.get(it.productId);
      const uom = uomById.get(it.uomId);
      const baseUom = uomById.get(it.baseUomId);

      if (!product) {
        errors[`items[${idx}].productId`] = 'Invalid productId';
        continue;
      }
      if (!uom) {
        errors[`items[${idx}].uomId`] = 'Invalid uomId';
      } else if (uom.unitCategoryId !== product.unitCategoryId) {
        errors[`items[${idx}].uomId`] = 'UOM not in product unit category';
      }
      if (!baseUom) {
        errors[`items[${idx}].baseUomId`] = 'Invalid baseUomId';
      } else {
        if (baseUom.unitCategoryId !== product.unitCategoryId) {
          errors[`items[${idx}].baseUomId`] =
            'Base UOM not in product unit category';
        }
        if (!baseUom.baseUnit) {
          errors[`items[${idx}].baseUomId`] =
            'Base UOM must be the category base unit';
        }
      }
    }

    if (Object.keys(errors).length) {
      throw new BadRequestException({ message: 'Validation failed', errors });
    }

    for (const it of dto.items ?? []) {
      const uom = uomById.get(it.uomId)!;
      const baseUom = uomById.get(it.baseUomId)!;

      // Compute unit from conversion rates: selectedRate / baseRate
      const selectedRate = Number(uom.conversionRate);
      const baseRate = Number(baseUom.conversionRate);
      const computedUnit = selectedRate / baseRate;

      // Compute baseQuantity = quantity × unit
      const baseQuantity = (it.quantity ?? 0) * computedUnit;

      const amount = (it.unitPrice ?? 0) * (it.quantity ?? 0);
      totalAmount += amount;
      totalQty += it.quantity ?? 0;
      const row = this.purchaseItemRepository.create({
        purchaseId: saved.id,
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        amount,
        description: it.description ?? undefined,
        status: 'NEW',
        uomId: it.uomId,
        baseUomId: it.baseUomId,
        unit: computedUnit, // Server-computed, ignores client submission
        baseQuantity, // Server-computed
      });
      items.push(row);
    }
    if (items.length) {
      await this.purchaseItemRepository.save(items);
    }

    saved.totalAmount = totalAmount;
    saved.amount = totalAmount;
    saved.totalQuantity = totalQty;
    return await this.purchaseRepository.save(saved);
  }

  async findAll(
    page = 1,
    limit = 20,
    q?: string,
  ): Promise<{ data: Purchase[]; total: number }> {
    const qb = this.purchaseRepository.createQueryBuilder('p');
    if (q) {
      qb.where('LOWER(p.series) LIKE :q OR LOWER(p.reference) LIKE :q', {
        q: `%${q.toLowerCase()}%`,
      });
    }
    qb.leftJoinAndSelect('p.purchaseItems', 'items')
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Purchase> {
    const row = await this.purchaseRepository.findOne({
      where: { id },
      relations: ['purchaseItems'],
    });
    if (!row) throw new NotFoundException('Purchase not found');
    return row;
  }

  async update(id: string, dto: UpdatePurchaseDto): Promise<Purchase> {
    // Load purchase without relations to avoid entity manager tracking issues
    const row = await this.purchaseRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Purchase not found');

    const updated = this.purchaseRepository.merge(row, {
      ...(dto.series !== undefined ? { series: dto.series } : {}),
      ...(dto.supplierId !== undefined ? { supplierId: dto.supplierId } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.orderDate !== undefined
        ? { orderDate: dto.orderDate ? new Date(dto.orderDate) : row.orderDate }
        : {}),
      ...(dto.paymentMethod !== undefined
        ? { paymentMethod: dto.paymentMethod }
        : {}),
      ...(dto.reference !== undefined ? { reference: dto.reference } : {}),
      ...(dto.note !== undefined ? { note: dto.note } : {}),
      ...(dto.purchaserId !== undefined
        ? { purchaserId: dto.purchaserId }
        : {}),
    });
    const savedHeader = await this.purchaseRepository.save(updated);

    if (dto.items) {
      const productIds = Array.from(new Set(dto.items.map((i) => i.productId)));
      const uomIds = Array.from(
        new Set(
          dto.items
            .flatMap((i) => [i.uomId, i.baseUomId])
            .filter((v): v is string => typeof v === 'string'),
        ),
      );
      const products = await this.productRepository.findByIds(productIds);
      const productById = new Map(products.map((p) => [p.id, p]));
      const uoms = await this.uomRepository.findByIds(uomIds);
      const uomById = new Map(uoms.map((u) => [u.id, u]));

      const errors: Record<string, string> = {};
      dto.items.forEach((it, idx) => {
        const product = productById.get(it.productId);
        const uom = uomById.get(it.uomId);
        const baseUom = uomById.get(it.baseUomId);
        if (!product) errors[`items[${idx}].productId`] = 'Invalid productId';
        if (!uom) errors[`items[${idx}].uomId`] = 'Invalid uomId';
        else if (uom.unitCategoryId !== product?.unitCategoryId)
          errors[`items[${idx}].uomId`] = 'UOM not in product unit category';
        if (!baseUom) errors[`items[${idx}].baseUomId`] = 'Invalid baseUomId';
        else {
          if (baseUom.unitCategoryId !== product?.unitCategoryId)
            errors[`items[${idx}].baseUomId`] =
              'Base UOM not in product unit category';
          if (!baseUom.baseUnit)
            errors[`items[${idx}].baseUomId`] =
              'Base UOM must be the category base unit';
        }
      });
      if (Object.keys(errors).length) {
        throw new BadRequestException({ message: 'Validation failed', errors });
      }

      // Delete existing items first using query builder (direct SQL, no entity manager tracking)
      await this.purchaseItemRepository
        .createQueryBuilder()
        .delete()
        .where('purchaseId = :purchaseId', { purchaseId: id })
        .execute();
      let totalAmount = 0;
      let totalQty = 0;
      const newItems: PurchaseItems[] = [];
      for (const it of dto.items) {
        const uom = uomById.get(it.uomId)!;
        const baseUom = uomById.get(it.baseUomId)!;

        // Compute unit from conversion rates: selectedRate / baseRate
        const selectedRate = Number(uom.conversionRate);
        const baseRate = Number(baseUom.conversionRate);
        const computedUnit = selectedRate / baseRate;

        // Compute baseQuantity = quantity × unit
        const baseQuantity = (it.quantity ?? 0) * computedUnit;

        const amount = (it.unitPrice ?? 0) * (it.quantity ?? 0);
        totalAmount += amount;
        totalQty += it.quantity ?? 0;
        newItems.push(
          this.purchaseItemRepository.create({
            purchaseId: id,
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            amount,
            description: it.description ?? undefined,
            status: 'NEW',
            uomId: it.uomId,
            baseUomId: it.baseUomId,
            unit: computedUnit, // Server-computed, ignores client submission
            baseQuantity, // Server-computed
          }),
        );
      }
      if (newItems.length) await this.purchaseItemRepository.save(newItems);
      savedHeader.totalAmount = totalAmount;
      savedHeader.amount = totalAmount;
      savedHeader.totalQuantity = totalQty;
      await this.purchaseRepository.save(savedHeader);

      // Reload with relations to return complete object
      return await this.findOne(id);
    }

    return savedHeader;
  }

  async remove(id: string): Promise<void> {
    const row = await this.findOne(id);
    await this.purchaseRepository.remove(row);
  }
}
