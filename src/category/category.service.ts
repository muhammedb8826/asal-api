import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const entity = this.categoryRepository.create({
      name: dto.name,
      status: dto.status ?? true,
      description: dto.description,
    });
    return await this.categoryRepository.save(entity);
  }

  async findAll(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<{ data: Category[]; total: number }> {
    const qb = this.categoryRepository.createQueryBuilder('c');
    if (search) {
      qb.where('LOWER(c.name) LIKE :q', { q: `%${search.toLowerCase()}%` });
    }
    qb.orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Category> {
    const row = await this.categoryRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Category not found');
    return row;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const row = await this.findOne(id);
    const updated = this.categoryRepository.merge(row, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
    });
    return await this.categoryRepository.save(updated);
  }

  async remove(id: string): Promise<void> {
    const row = await this.findOne(id);
    await this.categoryRepository.remove(row);
  }
}
