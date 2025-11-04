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
  BeforeInsert,
} from 'typeorm';
import { Supplier } from './supplier.entity';
import { PurchaseItems } from './purchase-item.entity';

@Entity('purchases')
export class Purchase {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  series: string;

  @Column()
  supplierId: string;

  @Column()
  status: string;

  @CreateDateColumn()
  orderDate: Date;

  @Column()
  paymentMethod: string;

  @Column('float')
  amount: number;

  @Column()
  reference: string;

  @Column('float')
  totalAmount: number;

  @Column()
  totalQuantity: number;

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  purchaserId: string;

  @OneToMany(() => PurchaseItems, (purchaseItems) => purchaseItems.purchase)
  purchaseItems: PurchaseItems[];

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
