import { randomUUID } from 'crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  BeforeInsert,
} from 'typeorm';
import { ApInvoice } from './ap-invoice.entity';
import { PurchaseItems } from './purchase-item.entity';
import { UOM } from './uom.entity';

@Entity('ap_invoice_items')
@Unique(['invoiceId', 'purchaseItemId'])
export class ApInvoiceItem {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  invoiceId: string;

  @Column()
  purchaseItemId: string;

  @Column('float')
  quantity: number; // in selected UOM

  @Column('float')
  unitPrice: number;

  @Column('float')
  amount: number;

  @Column()
  uomId: string;

  @Column()
  baseUomId: string;

  @Column('float')
  unit: number; // conversion: selected/base

  @Column('float')
  baseQuantity: number; // quantity * unit

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => ApInvoice, (inv) => inv.items)
  @JoinColumn({ name: 'invoiceId' })
  invoice: ApInvoice;

  @ManyToOne(() => PurchaseItems)
  @JoinColumn({ name: 'purchaseItemId' })
  purchaseItem: PurchaseItems;

  @ManyToOne(() => UOM)
  @JoinColumn({ name: 'uomId' })
  uom: UOM;

  @ManyToOne(() => UOM)
  @JoinColumn({ name: 'baseUomId' })
  baseUom: UOM;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) this.id = randomUUID();
  }
}
