import { randomUUID } from 'crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToOne,
  BeforeInsert,
} from 'typeorm';
import { Order } from './order.entity';
import { SalesPartner } from './sales-partner.entity';
import { CommissionTransaction } from './commission-transaction.entity';

@Entity('commissions')
export class Commission {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderId: string;

  @Column()
  salesPartnerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('float')
  totalAmount: number;

  @Column('float')
  paidAmount: number;

  @OneToMany(
    () => CommissionTransaction,
    (transaction) => transaction.commission,
    { onDelete: 'CASCADE' },
  )
  transactions: CommissionTransaction[];

  @OneToOne(() => Order, (order) => order.commission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => SalesPartner, (salesPartner) => salesPartner.commissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'salesPartnerId' })
  salesPartner: SalesPartner;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
