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
  Unique,
} from 'typeorm';
import { GRN } from './grn.entity';
import { PurchaseItems } from './purchase-item.entity';
import { UOM } from './uom.entity';

@Entity('grn_items')
@Unique(['grnId', 'purchaseItemId'])
export class GrnItem {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  grnId: string;

  @Column()
  purchaseItemId: string;

  @Column()
  quantityReceived: number; // Quantity in selected UOM

  @Column('float')
  baseQuantityReceived: number; // Computed based on UOM conversion

  @Column({ default: 'NEW' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  uomId: string; // UOM used for receiving

  @Column()
  baseUomId: string; // Base UOM for conversion

  @Column('float')
  unit: number; // Conversion unit (same logic as purchase items)

  @ManyToOne(() => GRN, (grn) => grn.grnItems)
  @JoinColumn({ name: 'grnId' })
  grn: GRN;

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
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
