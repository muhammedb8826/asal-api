import { randomUUID } from 'crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
  BeforeInsert,
} from 'typeorm';
import { Product } from './product.entity';
import { Purchase } from './purchase.entity';
import { UOM } from './uom.entity';
import { PurchaseItemNote } from './purchase-item-note.entity';

@Entity('purchase_items')
@Unique(['purchaseId', 'itemId'])
export class PurchaseItems {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  purchaseId: string;

  @Column()
  itemId: string;

  @Column()
  quantity: number;

  @Column('float')
  unitPrice: number;

  @Column('float')
  amount: number;

  @Column({ nullable: true })
  description: string;

  @Column()
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  uomId: string;

  @Column()
  baseUomId: string;

  @Column('float')
  unit: number;

  @OneToMany(
    () => PurchaseItemNote,
    (purchaseItemNote) => purchaseItemNote.purchaseItem,
  )
  purchaseItemNotes: PurchaseItemNote[];

  @ManyToOne(() => Product, (product) => product.purchases)
  @JoinColumn({ name: 'itemId' })
  product: Product;

  @ManyToOne(() => Purchase, (purchase) => purchase.purchaseItems)
  @JoinColumn({ name: 'purchaseId' })
  purchase: Purchase;

  @ManyToOne(() => UOM, (uom) => uom.purchaseItems)
  @JoinColumn({ name: 'uomId' })
  uoms: UOM;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
