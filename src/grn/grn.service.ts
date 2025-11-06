import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { GRN } from '../entities/grn.entity';
import { GrnItem } from '../entities/grn-item.entity';
import { Purchase } from '../entities/purchase.entity';
import { PurchaseItems } from '../entities/purchase-item.entity';
import { Product } from '../entities/product.entity';
import { UOM } from '../entities/uom.entity';
import { CreateGrnDto } from './dto/create-grn.dto';
import { UpdateGrnDto } from './dto/update-grn.dto';

@Injectable()
export class GrnService {
  constructor(
    @InjectRepository(GRN)
    private readonly grnRepository: Repository<GRN>,
    @InjectRepository(GrnItem)
    private readonly grnItemRepository: Repository<GrnItem>,
    @InjectRepository(Purchase)
    private readonly purchaseRepository: Repository<Purchase>,
    @InjectRepository(PurchaseItems)
    private readonly purchaseItemRepository: Repository<PurchaseItems>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(UOM)
    private readonly uomRepository: Repository<UOM>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private async generateSeries(): Promise<string> {
    // Find the last GRN with series matching GRN-XXXX pattern
    const lastGrn = await this.grnRepository
      .createQueryBuilder('g')
      .where('g.series LIKE :pattern', { pattern: 'GRN-%' })
      .orderBy('g.createdAt', 'DESC')
      .getOne();

    let nextNumber = 1;

    if (lastGrn && lastGrn.series) {
      // Extract the number from the series (e.g., "GRN-0001" -> 1)
      const match = lastGrn.series.match(/^GRN-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Format with leading zeros (4 digits): GRN-0001, GRN-0002, etc.
    return `GRN-${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Update product inventory by adding baseQuantityReceived
   */
  private async updateProductInventory(
    productId: string,
    baseQuantityReceived: number,
    operation: 'add' | 'subtract',
  ): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    if (operation === 'add') {
      product.quantity = (product.quantity || 0) + baseQuantityReceived;
    } else {
      product.quantity = Math.max(
        0,
        (product.quantity || 0) - baseQuantityReceived,
      );
    }

    await this.productRepository.save(product);
  }

  /**
   * Calculate total received quantity for a purchase item across all GRNs
   */
  private async getTotalReceivedQuantity(
    purchaseItemId: string,
  ): Promise<number> {
    type RawResult = { total?: string | number } | undefined;
    const result: RawResult = await this.grnItemRepository
      .createQueryBuilder('gi')
      .select('SUM(gi.baseQuantityReceived)', 'total')
      .where('gi.purchaseItemId = :purchaseItemId', { purchaseItemId })
      .getRawOne();

    const total = result?.total;
    return parseFloat(typeof total === 'string' ? total : String(total || '0'));
  }

  async create(dto: CreateGrnDto): Promise<GRN> {
    // Validate purchase exists
    const purchase = await this.purchaseRepository.findOne({
      where: { id: dto.purchaseId },
      relations: ['purchaseItems'],
    });
    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    // Generate series if not provided
    const series = dto.series ?? (await this.generateSeries());

    // Preload purchase items and validate
    const purchaseItemIds = Array.from(
      new Set(dto.items.map((i) => i.purchaseItemId)),
    );
    const purchaseItems =
      await this.purchaseItemRepository.findByIds(purchaseItemIds);
    const purchaseItemById = new Map(purchaseItems.map((pi) => [pi.id, pi]));

    // Validate all purchase items belong to the purchase
    const invalidPurchaseItems: string[] = [];
    purchaseItemIds.forEach((id) => {
      const item = purchaseItemById.get(id);
      if (!item || item.purchaseId !== dto.purchaseId) {
        invalidPurchaseItems.push(id);
      }
    });
    if (invalidPurchaseItems.length) {
      throw new BadRequestException(
        `Invalid purchase items: ${invalidPurchaseItems.join(', ')}`,
      );
    }

    // Preload products and UOMs for validation
    const productIds = Array.from(
      new Set(purchaseItems.map((pi) => pi.productId)),
    );
    const uomIds = Array.from(
      new Set(dto.items.flatMap((i) => [i.uomId, i.baseUomId]).filter(Boolean)),
    );
    const products = await this.productRepository.findByIds(productIds);
    const productById = new Map(products.map((p) => [p.id, p]));
    const uoms = await this.uomRepository.findByIds(uomIds);
    const uomById = new Map(uoms.map((u) => [u.id, u]));

    // Validate items and check received quantities
    const errors: Record<string, string> = {};
    for (let idx = 0; idx < dto.items.length; idx++) {
      const it = dto.items[idx];
      const purchaseItem = purchaseItemById.get(it.purchaseItemId);
      if (!purchaseItem) {
        errors[`items[${idx}].purchaseItemId`] = 'Invalid purchaseItemId';
        continue;
      }

      const product = productById.get(purchaseItem.productId);
      if (!product) {
        errors[`items[${idx}].productId`] = 'Product not found';
        continue;
      }

      const uom = uomById.get(it.uomId);
      const baseUom = uomById.get(it.baseUomId);

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

      // Validate baseUomId matches purchase item's baseUomId
      if (baseUom && purchaseItem.baseUomId !== baseUom.id) {
        errors[`items[${idx}].baseUomId`] =
          'Base UOM must match purchase item base UOM';
      }

      // Check total received quantity doesn't exceed ordered quantity
      if (uom && baseUom) {
        const selectedRate = Number(uom.conversionRate);
        const baseRate = Number(baseUom.conversionRate);
        const computedUnit = selectedRate / baseRate;
        const baseQuantityReceived = it.quantityReceived * computedUnit;

        const totalReceived = await this.getTotalReceivedQuantity(
          purchaseItem.id,
        );
        const orderedBaseQuantity = purchaseItem.baseQuantity;

        if (totalReceived + baseQuantityReceived > orderedBaseQuantity) {
          errors[`items[${idx}].quantityReceived`] =
            `Total received quantity (${totalReceived + baseQuantityReceived}) exceeds ordered quantity (${orderedBaseQuantity})`;
        }
      }
    }

    if (Object.keys(errors).length) {
      throw new BadRequestException({ message: 'Validation failed', errors });
    }

    // Wrap database writes in transaction for atomicity
    return await this.dataSource.transaction(async (manager) => {
      // Create GRN header using transaction manager
      const grn = manager.create(GRN, {
        series,
        purchaseId: dto.purchaseId,
        receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : undefined,
        status: dto.status ?? 'PENDING',
        receivedBy: dto.receivedBy ?? undefined,
        note: dto.note ?? undefined,
      });
      const savedGrn = await manager.save(GRN, grn);

      // Create GRN items and update inventory
      const grnItems: GrnItem[] = [];
      for (const it of dto.items) {
        const purchaseItem = purchaseItemById.get(it.purchaseItemId)!;
        const uom = uomById.get(it.uomId)!;
        const baseUom = uomById.get(it.baseUomId)!;

        // Compute unit from conversion rates: selectedRate / baseRate
        const selectedRate = Number(uom.conversionRate);
        const baseRate = Number(baseUom.conversionRate);
        const computedUnit = selectedRate / baseRate;

        // Compute baseQuantityReceived = quantityReceived × unit
        const baseQuantityReceived = it.quantityReceived * computedUnit;

        const grnItem = manager.create(GrnItem, {
          grnId: savedGrn.id,
          purchaseItemId: it.purchaseItemId,
          quantityReceived: it.quantityReceived,
          baseQuantityReceived,
          status: 'NEW',
          uomId: it.uomId,
          baseUomId: it.baseUomId,
          unit: computedUnit,
        });
        grnItems.push(grnItem);

        // Update product inventory using transaction manager
        const product = await manager.findOne(Product, {
          where: { id: purchaseItem.productId },
        });
        if (product) {
          product.quantity = (product.quantity || 0) + baseQuantityReceived;
          await manager.save(Product, product);
        }
      }

      if (grnItems.length) {
        await manager.save(GrnItem, grnItems);
      }

      // Update GRN status based on received quantities using transaction manager
      await this.updateGrnStatusInTransaction(manager, savedGrn.id);

      // Reload with relations
      const result = await manager.findOne(GRN, {
        where: { id: savedGrn.id },
        relations: ['grnItems', 'purchase', 'grnItems.purchaseItem'],
      });
      if (!result) {
        throw new NotFoundException('GRN not found after creation');
      }
      return result;
    });
  }

  /**
   * Update GRN status based on received vs ordered quantities (transaction version)
   */
  private async updateGrnStatusInTransaction(
    manager: EntityManager,
    grnId: string,
  ): Promise<void> {
    const grn = await manager.findOne(GRN, {
      where: { id: grnId },
      relations: ['grnItems'],
    });
    if (!grn) return;

    const purchase = await manager.findOne(Purchase, {
      where: { id: grn.purchaseId },
      relations: ['purchaseItems'],
    });
    if (!purchase) return;

    // Calculate total received for each purchase item across all GRNs
    let allComplete = true;
    let allPending = true;

    for (const purchaseItem of purchase.purchaseItems) {
      type RawResult = { total?: string | number } | undefined;
      const result: RawResult = await manager
        .createQueryBuilder(GrnItem, 'gi')
        .select('SUM(gi.baseQuantityReceived)', 'total')
        .where('gi.purchaseItemId = :purchaseItemId', {
          purchaseItemId: purchaseItem.id,
        })
        .getRawOne();

      const total = result?.total;
      const totalReceived = parseFloat(
        typeof total === 'string' ? total : String(total || '0'),
      );
      const ordered = purchaseItem.baseQuantity;

      if (totalReceived >= ordered) {
        allPending = false;
      } else if (totalReceived > 0) {
        allComplete = false;
        allPending = false;
      } else {
        allComplete = false;
      }
    }

    if (allComplete) {
      grn.status = 'COMPLETE';
    } else if (!allPending) {
      grn.status = 'PARTIAL';
    } else {
      grn.status = 'PENDING';
    }

    await manager.save(GRN, grn);
  }

  /**
   * Update GRN status based on received vs ordered quantities
   */
  private async updateGrnStatus(grnId: string): Promise<void> {
    const grn = await this.grnRepository.findOne({
      where: { id: grnId },
      relations: ['grnItems'],
    });
    if (!grn) return;

    const purchase = await this.purchaseRepository.findOne({
      where: { id: grn.purchaseId },
      relations: ['purchaseItems'],
    });
    if (!purchase) return;

    // Calculate total received for each purchase item
    const purchaseItemReceivedMap = new Map<string, number>();
    for (const grnItem of grn.grnItems) {
      const current = purchaseItemReceivedMap.get(grnItem.purchaseItemId) || 0;
      purchaseItemReceivedMap.set(
        grnItem.purchaseItemId,
        current + grnItem.baseQuantityReceived,
      );
    }

    // Check if all items are fully received
    let allComplete = true;
    let allPending = true;

    for (const purchaseItem of purchase.purchaseItems) {
      const totalReceived = await this.getTotalReceivedQuantity(
        purchaseItem.id,
      );
      const ordered = purchaseItem.baseQuantity;

      if (totalReceived >= ordered) {
        allPending = false;
      } else if (totalReceived > 0) {
        allComplete = false;
        allPending = false;
      } else {
        allComplete = false;
      }
    }

    if (allComplete) {
      grn.status = 'COMPLETE';
    } else if (!allPending) {
      grn.status = 'PARTIAL';
    } else {
      grn.status = 'PENDING';
    }

    await this.grnRepository.save(grn);
  }

  async findAll(
    page = 1,
    limit = 20,
    q?: string,
    purchaseId?: string,
  ): Promise<{ data: GRN[]; total: number }> {
    const qb = this.grnRepository.createQueryBuilder('g');
    if (q) {
      qb.where('LOWER(g.series) LIKE :q OR LOWER(g.note) LIKE :q', {
        q: `%${q.toLowerCase()}%`,
      });
    }
    if (purchaseId) {
      qb.andWhere('g.purchaseId = :purchaseId', { purchaseId });
    }
    qb.leftJoinAndSelect('g.grnItems', 'items')
      .leftJoinAndSelect('g.purchase', 'purchase')
      .orderBy('g.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<GRN> {
    const row = await this.grnRepository.findOne({
      where: { id },
      relations: ['grnItems', 'purchase', 'grnItems.purchaseItem'],
    });
    if (!row) throw new NotFoundException('GRN not found');
    return row;
  }

  async update(id: string, dto: UpdateGrnDto): Promise<GRN> {
    // Load GRN without relations to avoid entity manager tracking issues
    const row = await this.grnRepository.findOne({
      where: { id },
      relations: ['grnItems'],
    });
    if (!row) throw new NotFoundException('GRN not found');

    // Revert old inventory changes
    for (const grnItem of row.grnItems) {
      const purchaseItem = await this.purchaseItemRepository.findOne({
        where: { id: grnItem.purchaseItemId },
      });
      if (purchaseItem) {
        await this.updateProductInventory(
          purchaseItem.productId,
          grnItem.baseQuantityReceived,
          'subtract',
        );
      }
    }

    // Update header fields
    const updated = this.grnRepository.merge(row, {
      ...(dto.series !== undefined ? { series: dto.series } : {}),
      ...(dto.purchaseId !== undefined ? { purchaseId: dto.purchaseId } : {}),
      ...(dto.receivedDate !== undefined
        ? {
            receivedDate: dto.receivedDate
              ? new Date(dto.receivedDate)
              : row.receivedDate,
          }
        : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.receivedBy !== undefined ? { receivedBy: dto.receivedBy } : {}),
      ...(dto.note !== undefined ? { note: dto.note } : {}),
    });
    const savedHeader = await this.grnRepository.save(updated);

    // Update items if provided
    if (dto.items) {
      // Validate purchase exists if purchaseId changed
      const purchaseId = dto.purchaseId ?? row.purchaseId;
      const purchase = await this.purchaseRepository.findOne({
        where: { id: purchaseId },
        relations: ['purchaseItems'],
      });
      if (!purchase) {
        throw new NotFoundException('Purchase not found');
      }

      // Preload purchase items
      const purchaseItemIds = Array.from(
        new Set(dto.items.map((i) => i.purchaseItemId).filter(Boolean)),
      );
      const purchaseItems =
        await this.purchaseItemRepository.findByIds(purchaseItemIds);
      const purchaseItemById = new Map(purchaseItems.map((pi) => [pi.id, pi]));

      // Validate purchase items belong to purchase
      for (const item of dto.items) {
        if (item.purchaseItemId) {
          const pi = purchaseItemById.get(item.purchaseItemId);
          if (!pi || pi.purchaseId !== purchaseId) {
            throw new BadRequestException(
              `Purchase item ${item.purchaseItemId} does not belong to purchase ${purchaseId}`,
            );
          }
        }
      }

      // Preload products and UOMs
      const productIds = Array.from(
        new Set(purchaseItems.map((pi) => pi.productId)),
      );
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

      // Validate items
      const errors: Record<string, string> = {};
      dto.items.forEach((it, idx) => {
        if (!it.purchaseItemId) {
          errors[`items[${idx}].purchaseItemId`] = 'purchaseItemId is required';
          return;
        }

        const purchaseItem = purchaseItemById.get(it.purchaseItemId);
        if (!purchaseItem) {
          errors[`items[${idx}].purchaseItemId`] = 'Invalid purchaseItemId';
          return;
        }

        const product = productById.get(purchaseItem.productId);
        if (!product) return;

        const uom = it.uomId ? uomById.get(it.uomId) : null;
        const baseUom = it.baseUomId ? uomById.get(it.baseUomId) : null;

        if (it.uomId && !uom) {
          errors[`items[${idx}].uomId`] = 'Invalid uomId';
        } else if (uom && uom.unitCategoryId !== product.unitCategoryId) {
          errors[`items[${idx}].uomId`] = 'UOM not in product unit category';
        }

        if (it.baseUomId && !baseUom) {
          errors[`items[${idx}].baseUomId`] = 'Invalid baseUomId';
        } else if (baseUom) {
          if (baseUom.unitCategoryId !== product.unitCategoryId) {
            errors[`items[${idx}].baseUomId`] =
              'Base UOM not in product unit category';
          }
          if (!baseUom.baseUnit) {
            errors[`items[${idx}].baseUomId`] =
              'Base UOM must be the category base unit';
          }
          if (baseUom.id !== purchaseItem.baseUomId) {
            errors[`items[${idx}].baseUomId`] =
              'Base UOM must match purchase item base UOM';
          }
        }
      });

      if (Object.keys(errors).length) {
        throw new BadRequestException({ message: 'Validation failed', errors });
      }

      // Delete existing items using query builder
      await this.grnItemRepository
        .createQueryBuilder()
        .delete()
        .where('grnId = :grnId', { grnId: id })
        .execute();

      // Validate over-receipt against other GRNs before creating new items
      {
        const validationErrors: Record<string, string> = {};
        for (let idx = 0; idx < dto.items.length; idx++) {
          const it = dto.items[idx];
          if (!it.purchaseItemId || !it.uomId || !it.baseUomId) continue;
          const purchaseItem = purchaseItemById.get(it.purchaseItemId)!;
          const uom = uomById.get(it.uomId)!;
          const baseUom = uomById.get(it.baseUomId)!;

          const selectedRate = Number(uom.conversionRate);
          const baseRate = Number(baseUom.conversionRate);
          const computedUnit = selectedRate / baseRate;
          const baseQuantityReceived =
            (it.quantityReceived ?? 0) * computedUnit;

          // At this point, current GRN items have been deleted, so this sums other GRNs only
          const totalReceivedInOtherGrns = await this.getTotalReceivedQuantity(
            purchaseItem.id,
          );
          const orderedBaseQuantity = purchaseItem.baseQuantity;
          if (
            totalReceivedInOtherGrns + baseQuantityReceived >
            orderedBaseQuantity
          ) {
            validationErrors[`items[${idx}].quantityReceived`] =
              `Total received quantity (${totalReceivedInOtherGrns + baseQuantityReceived}) exceeds ordered quantity (${orderedBaseQuantity})`;
          }
        }
        if (Object.keys(validationErrors).length) {
          throw new BadRequestException({
            message: 'Validation failed',
            errors: validationErrors,
          });
        }
      }

      // Create new items and update inventory
      const newItems: GrnItem[] = [];
      for (const it of dto.items) {
        if (!it.purchaseItemId || !it.uomId || !it.baseUomId) continue;

        const purchaseItem = purchaseItemById.get(it.purchaseItemId)!;
        const uom = uomById.get(it.uomId)!;
        const baseUom = uomById.get(it.baseUomId)!;

        const selectedRate = Number(uom.conversionRate);
        const baseRate = Number(baseUom.conversionRate);
        const computedUnit = selectedRate / baseRate;
        const baseQuantityReceived = (it.quantityReceived ?? 0) * computedUnit;

        newItems.push(
          this.grnItemRepository.create({
            grnId: id,
            purchaseItemId: it.purchaseItemId,
            quantityReceived: it.quantityReceived ?? 0,
            baseQuantityReceived,
            status: 'NEW',
            uomId: it.uomId,
            baseUomId: it.baseUomId,
            unit: computedUnit,
          }),
        );

        // Update product inventory
        await this.updateProductInventory(
          purchaseItem.productId,
          baseQuantityReceived,
          'add',
        );
      }

      if (newItems.length) {
        await this.grnItemRepository.save(newItems);
      }

      // Update GRN status
      await this.updateGrnStatus(savedHeader.id);
    }

    // Reload with relations to return complete object
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const row = await this.findOne(id);

    // Block deletion if status is COMPLETE
    if (row.status === 'COMPLETE') {
      throw new BadRequestException(
        'Cannot delete GRN with status COMPLETE. Completed GRNs cannot be deleted.',
      );
    }

    // Wrap in transaction for atomicity
    await this.dataSource.transaction(async (manager) => {
      // Reload GRN within transaction
      const grnInTx = await manager.findOne(GRN, {
        where: { id },
        relations: ['grnItems'],
      });
      if (!grnInTx) throw new NotFoundException('GRN not found');

      // Revert inventory changes before deleting
      for (const grnItem of grnInTx.grnItems) {
        const purchaseItem = await manager.findOne(PurchaseItems, {
          where: { id: grnItem.purchaseItemId },
        });
        if (purchaseItem) {
          const product = await manager.findOne(Product, {
            where: { id: purchaseItem.productId },
          });
          if (product) {
            product.quantity = Math.max(
              0,
              (product.quantity || 0) - grnItem.baseQuantityReceived,
            );
            await manager.save(Product, product);
          }
        }
      }

      // Delete GRN items first
      await manager
        .createQueryBuilder()
        .delete()
        .from(GrnItem)
        .where('grnId = :grnId', { grnId: id })
        .execute();

      // Delete GRN
      await manager.remove(GRN, grnInTx);
    });
  }
}
