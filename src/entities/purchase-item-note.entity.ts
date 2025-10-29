import { randomUUID } from 'crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { PurchaseItems } from './purchase-item.entity';

@Entity('purchase_item_note')
@Index(['purchaseItemId'])
@Index(['userId'])
export class PurchaseItemNote {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  text: string;

  @Column()
  userId: string;

  @Column()
  date: Date;

  @Column()
  hour: Date;

  @Column()
  purchaseItemId: string;

  @ManyToOne(
    () => PurchaseItems,
    (purchaseItem) => purchaseItem.purchaseItemNotes,
  )
  @JoinColumn({ name: 'purchaseItemId' })
  purchaseItem: PurchaseItems;

  @CreateDateColumn()
  createdAt: Date;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
