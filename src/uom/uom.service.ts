import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UOM } from '../entities/uom.entity';
import { CreateUomDto, UpdateUomDto } from './dto';

@Injectable()
export class UomService {
  constructor(
    @InjectRepository(UOM)
    private readonly uomRepository: Repository<UOM>,
  ) {}

  async create(dto: CreateUomDto): Promise<UOM> {
    // Enforce single baseUnit per category by demoting existing base
    if (dto.baseUnit) {
      await this.uomRepository
        .createQueryBuilder()
        .update(UOM)
        .set({ baseUnit: false })
        .where('unitCategoryId = :unitCategoryId', {
          unitCategoryId: dto.unitCategoryId,
        })
        .andWhere('baseUnit = :base', { base: true })
        .execute();
    }

    const entity = this.uomRepository.create({
      name: dto.name,
      abbreviation: dto.abbreviation,
      conversionRate: dto.conversionRate,
      baseUnit: dto.baseUnit,
      unitCategoryId: dto.unitCategoryId,
    });
    return await this.uomRepository.save(entity);
  }

  async findAll(
    page = 1,
    limit = 20,
    q?: string,
    unitCategoryId?: string,
  ): Promise<{ data: UOM[]; total: number }> {
    const qb = this.uomRepository.createQueryBuilder('u');
    if (q) {
      qb.where('LOWER(u.name) LIKE :q OR LOWER(u.abbreviation) LIKE :q', {
        q: `%${q.toLowerCase()}%`,
      });
    }
    if (unitCategoryId) {
      qb.andWhere('u.unitCategoryId = :unitCategoryId', { unitCategoryId });
    }
    qb.orderBy('u.createdAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<UOM> {
    const row = await this.uomRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException('UOM not found');
    return row;
  }

  async update(id: string, dto: UpdateUomDto): Promise<UOM> {
    const row = await this.findOne(id);
    const targetCategoryId = dto.unitCategoryId ?? row.unitCategoryId;

    if (dto.baseUnit === true) {
      await this.uomRepository
        .createQueryBuilder()
        .update(UOM)
        .set({ baseUnit: false })
        .where('unitCategoryId = :unitCategoryId', {
          unitCategoryId: targetCategoryId,
        })
        .andWhere('id <> :id', { id })
        .andWhere('baseUnit = :base', { base: true })
        .execute();
    }

    const updated = this.uomRepository.merge(row, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.abbreviation !== undefined
        ? { abbreviation: dto.abbreviation }
        : {}),
      ...(dto.conversionRate !== undefined
        ? { conversionRate: dto.conversionRate }
        : {}),
      ...(dto.baseUnit !== undefined ? { baseUnit: dto.baseUnit } : {}),
      ...(dto.unitCategoryId !== undefined
        ? { unitCategoryId: dto.unitCategoryId }
        : {}),
    });
    return await this.uomRepository.save(updated);
  }

  async remove(id: string): Promise<void> {
    const row = await this.findOne(id);
    await this.uomRepository.remove(row);
  }
}
