import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitCategory } from '../entities/unit-category.entity';
import { CreateUnitCategoryDto, UpdateUnitCategoryDto } from './dto';

@Injectable()
export class UnitCategoryService {
  constructor(
    @InjectRepository(UnitCategory)
    private readonly unitCategoryRepository: Repository<UnitCategory>,
  ) {}

  async create(dto: CreateUnitCategoryDto): Promise<UnitCategory> {
    const entity = this.unitCategoryRepository.create({
      name: dto.name,
      description: dto.description,
      constant: dto.constant,
      constantValue: dto.constantValue,
    });
    return await this.unitCategoryRepository.save(entity);
  }

  async findAll(
    page = 1,
    limit = 20,
    q?: string,
  ): Promise<{ data: UnitCategory[]; total: number }> {
    const qb = this.unitCategoryRepository.createQueryBuilder('c');
    if (q) {
      qb.where('LOWER(c.name) LIKE :q', { q: `%${q.toLowerCase()}%` });
    }
    qb.orderBy('c.createdAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<UnitCategory> {
    const row = await this.unitCategoryRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Unit category not found');
    return row;
  }

  async update(id: string, dto: UpdateUnitCategoryDto): Promise<UnitCategory> {
    const row = await this.findOne(id);
    const updated = this.unitCategoryRepository.merge(row, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.constant !== undefined ? { constant: dto.constant } : {}),
      ...(dto.constantValue !== undefined
        ? { constantValue: dto.constantValue }
        : {}),
    });
    return await this.unitCategoryRepository.save(updated);
  }

  async remove(id: string): Promise<void> {
    const row = await this.findOne(id);
    await this.unitCategoryRepository.remove(row);
  }
}
