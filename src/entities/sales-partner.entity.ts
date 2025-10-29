import { randomUUID } from 'crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { Commission } from './commission.entity';
import { Order } from './order.entity';

@Entity('sales_partners')
export class SalesPartner {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  company: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Commission, (commission) => commission.salesPartner)
  commissions: Commission[];

  @OneToMany(() => Order, (order) => order.salesPartner)
  orders: Order[];

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
