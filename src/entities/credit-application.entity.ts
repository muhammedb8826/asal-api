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
import { SupplierCredit } from './supplier-credit.entity';
import { ApInvoice } from './ap-invoice.entity';

@Entity('credit_applications')
export class CreditApplication {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  creditId: string;

  @Column({ type: 'uuid' })
  invoiceId: string;

  @Column({ type: 'float' })
  amount: number; // Amount applied to this invoice

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => SupplierCredit, (credit) => credit.applications)
  @JoinColumn({ name: 'creditId' })
  credit: SupplierCredit;

  @ManyToOne(() => ApInvoice)
  @JoinColumn({ name: 'invoiceId' })
  invoice: ApInvoice;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) this.id = randomUUID();
  }
}
