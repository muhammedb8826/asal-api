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
import { PaymentApplication } from './payment-application.entity';

@Entity('supplier_payments')
export class SupplierPayment {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  series: string; // e.g., PAY-0001

  @Column({ type: 'uuid' })
  supplierId: string;

  @Column({ type: 'date' })
  paymentDate: Date;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'text', nullable: true })
  paymentMethod: string | null; // Cash, Bank Transfer, Check, etc.

  @Column({ type: 'text', nullable: true })
  reference: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'text', default: 'POSTED' })
  status: string; // DRAFT, POSTED, CANCELLED

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PaymentApplication, (app) => app.payment)
  applications: PaymentApplication[];

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) this.id = randomUUID();
  }
}
