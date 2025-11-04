import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(
    dto: CreateProductDto,
    imageFilename?: string,
  ): Promise<Product> {
    const entity = this.productRepository.create({
      name: dto.name,
      internalNote: dto.internalNote,
      reorderLevel: dto.reorderLevel,
      categoryId: dto.categoryId,
      canBePurchased: dto.canBePurchased ?? true,
      canBeSold: dto.canBeSold ?? true,
      quantity: dto.quantity ?? 0,
      unitCategoryId: dto.unitCategoryId,
      defaultUomId: dto.defaultUomId,
      purchaseUomId: dto.purchaseUomId,
      image: imageFilename || dto.image,
    });
    return await this.productRepository.save(entity);
  }

  async findAll(
    page = 1,
    limit = 20,
    q?: string,
  ): Promise<{ data: Product[]; total: number }> {
    const qb = this.productRepository.createQueryBuilder('p');
    if (q) {
      qb.where('LOWER(p.name) LIKE :q', { q: `%${q.toLowerCase()}%` });
    }
    qb.orderBy('p.createdAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Product> {
    const row = await this.productRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Product not found');
    return row;
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    imageFilename?: string,
  ): Promise<Product> {
    const row = await this.findOne(id);
    const toBool = (v: unknown): boolean | undefined => {
      if (v === undefined || v === null) return undefined;
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string' || typeof v === 'number') {
        const s = String(v).trim().toLowerCase();
        if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
        if (s === 'false' || s === '0' || s === 'no' || s === 'off')
          return false;
      }
      return undefined;
    };
    const canBePurchasedNorm = toBool(dto.canBePurchased);
    const canBeSoldNorm = toBool(dto.canBeSold);
    const updated = this.productRepository.merge(row, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.internalNote !== undefined
        ? { internalNote: dto.internalNote }
        : {}),
      ...(dto.reorderLevel !== undefined
        ? { reorderLevel: dto.reorderLevel }
        : {}),
      ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
      ...(canBePurchasedNorm !== undefined
        ? { canBePurchased: canBePurchasedNorm }
        : {}),
      ...(canBeSoldNorm !== undefined ? { canBeSold: canBeSoldNorm } : {}),
      ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
      ...(dto.unitCategoryId !== undefined
        ? { unitCategoryId: dto.unitCategoryId }
        : {}),
      ...(dto.defaultUomId !== undefined
        ? { defaultUomId: dto.defaultUomId }
        : {}),
      ...(dto.purchaseUomId !== undefined
        ? { purchaseUomId: dto.purchaseUomId }
        : {}),
      ...(imageFilename !== undefined ? { image: imageFilename } : {}),
      ...(dto.image !== undefined ? { image: dto.image } : {}),
    });
    return await this.productRepository.save(updated);
  }

  async remove(id: string): Promise<void> {
    const row = await this.findOne(id);
    await this.productRepository.remove(row);
  }
}
