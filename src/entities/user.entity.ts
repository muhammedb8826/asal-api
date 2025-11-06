import { randomUUID } from 'crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { Role } from '../enums/role.enum';
import { Gender } from '../enums/gender.enum';

@Entity('user')
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'text', nullable: true })
  passwordRT: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  address: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ type: 'enum', enum: Gender, default: Gender.MALE })
  gender: Gender;

  @Column({ nullable: true })
  last_name: string;

  @Column({ nullable: true })
  middle_name: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  profile: string;

  @Column({ type: 'enum', enum: Role, default: Role.ADMIN })
  roles: Role;

  @Column()
  confirm_password: string;

  @Column({ default: true })
  is_active: boolean;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
