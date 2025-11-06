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
import { CreditApplication } from './credit-application.entity';

@Entity('supplier_credits')
export class SupplierCredit {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  series: string; // e.g., CREDIT-0001

  @Column({ type: 'uuid' })
  supplierId: string;

  @Column({ type: 'uuid', nullable: true })
  purchaseId: string | null;

  @Column({ type: 'date', nullable: true })
  creditDate: Date | null;

  @Column({ type: 'text', nullable: true })
  reference: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null; // Return, Damage, Price Adjustment, etc.

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  @Column({ type: 'float', default: 0 })
  appliedAmount: number; // Amount applied to invoices

  @Column({ type: 'float', default: 0 })
  outstandingAmount: number; // Computed: totalAmount - appliedAmount

  @Column({ type: 'text', default: 'DRAFT' })
  status: string; // DRAFT, POSTED, PARTIALLY_APPLIED, FULLY_APPLIED, CLOSED

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CreditApplication, (app) => app.credit)
  applications: CreditApplication[];

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) this.id = randomUUID();
  }
}
