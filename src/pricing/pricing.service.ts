import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pricing } from '../entities/pricing.entity';
import { CreatePricingDto, UpdatePricingDto } from './dto';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(Pricing)
    private readonly pricingRepository: Repository<Pricing>,
  ) {}

  async create(dto: CreatePricingDto): Promise<Pricing> {
    // Close any current active pricing for this item (simple strategy)
    await this.pricingRepository
      .createQueryBuilder()
      .update(Pricing)
      .set({ isActive: false, effectiveTo: new Date() })
      .where('itemId = :itemId', { itemId: dto.itemId })
      .andWhere('isActive = :active', { active: true })
      .execute();

    const pricing = this.pricingRepository.create({
      itemId: dto.itemId,
      sellingPrice: dto.sellingPrice,
      costPrice: dto.costPrice,
      effectiveFrom: dto.effectiveFrom
        ? new Date(dto.effectiveFrom)
        : new Date(),
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      isActive: dto.isActive ?? true,
      customerType: dto.customerType ?? null,
      minQuantity: dto.minQuantity ?? null,
    });
    return await this.pricingRepository.save(pricing);
  }

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{ data: Pricing[]; total: number }> {
    const [data, total] = await this.pricingRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { effectiveFrom: 'DESC' },
    });
    return { data, total };
  }

  async findOne(id: string): Promise<Pricing> {
    const row = await this.pricingRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Pricing not found');
    return row;
  }

  async update(id: string, dto: UpdatePricingDto): Promise<Pricing> {
    const row = await this.findOne(id);
    const updated = this.pricingRepository.merge(row, {
      sellingPrice: dto.sellingPrice ?? row.sellingPrice,
      costPrice: dto.costPrice ?? row.costPrice,
      effectiveFrom: dto.effectiveFrom
        ? new Date(dto.effectiveFrom)
        : row.effectiveFrom,
      effectiveTo:
        dto.effectiveTo === undefined
          ? row.effectiveTo
          : dto.effectiveTo
            ? new Date(dto.effectiveTo)
            : null,
      isActive: dto.isActive ?? row.isActive,
      customerType: dto.customerType ?? row.customerType,
      minQuantity: dto.minQuantity ?? row.minQuantity,
    });
    await this.pricingRepository.save(updated);
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    const row = await this.findOne(id);
    row.isActive = false;
    row.effectiveTo = new Date();
    await this.pricingRepository.save(row);
  }

  async getCurrent(itemId: string, asOf?: Date): Promise<Pricing | null> {
    const now = asOf ?? new Date();
    return await this.pricingRepository
      .createQueryBuilder('p')
      .where('p.itemId = :itemId', { itemId })
      .andWhere('p.effectiveFrom <= :now', { now })
      .andWhere('(p.effectiveTo IS NULL OR p.effectiveTo > :now)', { now })
      .andWhere('p.isActive = true')
      .orderBy('p.effectiveFrom', 'DESC')
      .getOne();
  }
}
