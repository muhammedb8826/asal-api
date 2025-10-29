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
import { Vendor } from './vendor.entity';
import { PurchaseItems } from './purchase-item.entity';

@Entity('purchases')
export class Purchase {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  series: string;

  @Column()
  vendorId: string;

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

  @ManyToOne(() => Vendor, (vendor) => vendor.purchases)
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
