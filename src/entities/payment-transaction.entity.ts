import { randomUUID } from 'crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { PaymentTerm } from './payment-term.entity';

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  date: Date;

  @Column()
  paymentTermId: string;

  @Column()
  paymentMethod: string;

  @Column()
  reference: string;

  @Column('float')
  amount: number;

  @Column()
  status: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => PaymentTerm, (paymentTerm) => paymentTerm.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paymentTermId' })
  paymentTerm: PaymentTerm;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
