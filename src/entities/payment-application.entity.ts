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
import { SupplierPayment } from './supplier-payment.entity';
import { ApInvoice } from './ap-invoice.entity';

@Entity('payment_applications')
export class PaymentApplication {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  paymentId: string;

  @Column({ type: 'uuid' })
  invoiceId: string;

  @Column({ type: 'float' })
  amount: number; // Amount applied to this invoice

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => SupplierPayment, (payment) => payment.applications)
  @JoinColumn({ name: 'paymentId' })
  payment: SupplierPayment;

  @ManyToOne(() => ApInvoice)
  @JoinColumn({ name: 'invoiceId' })
  invoice: ApInvoice;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) this.id = randomUUID();
  }
}
