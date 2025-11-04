import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const entity = this.supplierRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      company: dto.company,
      address: dto.address,
      reference: dto.reference,
      description: dto.description,
    });
    return await this.supplierRepository.save(entity);
  }

  async findAll(
    page = 1,
    limit = 20,
    q?: string,
  ): Promise<{ data: Supplier[]; total: number }> {
    const qb = this.supplierRepository.createQueryBuilder('s');
    if (q) {
      qb.where(
        'LOWER(s.fullName) LIKE :q OR LOWER(s.phone) LIKE :q OR LOWER(s.email) LIKE :q',
        { q: `%${q.toLowerCase()}%` },
      );
    }
    qb.orderBy('s.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Supplier> {
    const row = await this.supplierRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Supplier not found');
    return row;
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    const row = await this.findOne(id);
    const updated = this.supplierRepository.merge(row, {
      ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.company !== undefined ? { company: dto.company } : {}),
      ...(dto.address !== undefined ? { address: dto.address } : {}),
      ...(dto.reference !== undefined ? { reference: dto.reference } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
    });
    return await this.supplierRepository.save(updated);
  }

  async remove(id: string): Promise<void> {
    const row = await this.findOne(id);
    await this.supplierRepository.remove(row);
  }
}
