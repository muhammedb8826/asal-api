import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
const { hash: bcryptHash, compare: bcryptCompare } = bcrypt as unknown as {
  hash: (data: string, saltOrRounds: number) => Promise<string>;
  compare: (data: string, encrypted: string) => Promise<boolean>;
};
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    if (dto.confirmPassword !== dto.password) {
      throw new BadRequestException('Passwords do not match');
    }
    const hashed = await bcryptHash(dto.password, 10);
    const entity = this.userRepo.create({
      email: dto.email,
      password: hashed,
      address: dto.address,
      first_name: dto.firstName ?? undefined,
      last_name: dto.lastName ?? undefined,
      middle_name: dto.middleName ?? undefined,
      phone: dto.phone,
      gender: dto.gender ?? undefined,
      profile: dto.profile ?? undefined,
      roles: dto.roles ?? undefined,
      is_active: dto.isActive ?? true,
      passwordRT: null,
      confirm_password: hashed,
    });
    return await this.userRepo.save(entity);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findOne(userId);
    const ok = await bcryptCompare(currentPassword, user.password);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');
    const sameAsOld = await bcryptCompare(newPassword, user.password);
    if (sameAsOld)
      throw new BadRequestException('New password must be different');
    const newHashed = await bcryptHash(newPassword, 10);
    user.password = newHashed;
    user.confirm_password = newHashed;
    await this.userRepo.save(user);
  }

  async findAll(
    page = 1,
    limit = 20,
    q?: string,
  ): Promise<{ data: User[]; total: number }> {
    const qb = this.userRepo.createQueryBuilder('u');
    if (q) {
      qb.where('LOWER(u.email) LIKE :q OR LOWER(u.phone) LIKE :q', {
        q: `%${q.toLowerCase()}%`,
      });
    }
    qb.orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<User> {
    const row = await this.userRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('User not found');
    return row;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const row = await this.findOne(id);
    const mapped: Partial<User> = {
      email: dto.email ?? row.email,
      password: dto.password ?? row.password,
      address: dto.address ?? row.address,
      first_name: dto.firstName ?? row.first_name,
      last_name: dto.lastName ?? row.last_name,
      middle_name: dto.middleName ?? row.middle_name,
      phone: dto.phone ?? row.phone,
      gender: dto.gender ?? row.gender,
      profile: dto.profile ?? row.profile,
      roles: dto.roles ?? row.roles,
      is_active: dto.isActive ?? row.is_active,
      confirm_password: dto.password ? dto.password : row.confirm_password,
    };
    const merged = this.userRepo.merge(row, mapped);
    return await this.userRepo.save(merged);
  }

  async remove(id: string): Promise<void> {
    const row = await this.findOne(id);
    await this.userRepo.remove(row);
  }

  async updateProfileImage(userId: string, filename: string): Promise<User> {
    const row = await this.findOne(userId);
    row.profile = filename;
    return await this.userRepo.save(row);
  }
}
