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
import { ApInvoiceItem } from './ap-invoice-item.entity';

@Entity('ap_invoices')
export class ApInvoice {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  series: string; // e.g., AP-0001

  @Column({ type: 'uuid' })
  supplierId: string;

  @Column({ type: 'uuid', nullable: true })
  purchaseId: string | null;

  @Column({ type: 'date', nullable: true })
  invoiceDate: Date | null;

  @Column({ type: 'text', nullable: true })
  reference: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'text', nullable: true })
  supplierInvoiceNumber: string | null; // Supplier's invoice number (unique per supplier)

  @Column({ type: 'int', nullable: true })
  paymentTerms: number | null; // Payment terms in days (e.g., 30, 60)

  @Column({ type: 'date', nullable: true })
  dueDate: Date | null; // Computed: invoiceDate + paymentTerms

  @Column({ type: 'text', default: 'DRAFT' })
  status: string; // DRAFT, POSTED, PARTIALLY_PAID, PAID, CLOSED

  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  @Column({ type: 'float', default: 0 })
  paidAmount: number; // Total amount paid against this invoice

  @Column({ type: 'float', default: 0 })
  outstandingAmount: number; // Computed: totalAmount - paidAmount

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ApInvoiceItem, (it) => it.invoice)
  items: ApInvoiceItem[];

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) this.id = randomUUID();
  }
}
