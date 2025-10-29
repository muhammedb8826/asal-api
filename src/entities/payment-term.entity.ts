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
  BeforeInsert,
} from 'typeorm';
import { Order } from './order.entity';
import { PaymentTransaction } from './payment-transaction.entity';

@Entity('payment_terms')
export class PaymentTerm {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderId: string;

  @Column('float')
  totalAmount: number;

  @Column('float')
  remainingAmount: number;

  @Column()
  status: string;

  @Column()
  forcePayment: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Order, (order) => order.paymentTerm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @OneToMany(
    () => PaymentTransaction,
    (transaction) => transaction.paymentTerm,
    { onDelete: 'CASCADE' },
  )
  transactions: PaymentTransaction[];

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
