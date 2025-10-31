import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const entity = this.customerRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      company: dto.company,
      address: dto.address,
      description: dto.description,
      customerType: dto.customerType ?? null,
    });
    return await this.customerRepository.save(entity);
  }

  async findAll(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<{ data: Customer[]; total: number }> {
    const qb = this.customerRepository.createQueryBuilder('c');
    if (search) {
      qb.where(
        'LOWER(c.fullName) LIKE :q OR LOWER(c.phone) LIKE :q OR LOWER(c.email) LIKE :q',
        {
          q: `%${search.toLowerCase()}%`,
        },
      );
    }
    qb.orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Customer> {
    const row = await this.customerRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Customer not found');
    return row;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const row = await this.findOne(id);
    const updated = this.customerRepository.merge(row, {
      ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.company !== undefined ? { company: dto.company } : {}),
      ...(dto.address !== undefined ? { address: dto.address } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.customerType !== undefined
        ? { customerType: dto.customerType }
        : {}),
    });
    return await this.customerRepository.save(updated);
  }

  async remove(id: string): Promise<void> {
    const row = await this.findOne(id);
    await this.customerRepository.remove(row);
  }
}
