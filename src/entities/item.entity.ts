import { randomUUID } from 'crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { Category } from './category.entity';
import { UOM } from './uom.entity';
import { UnitCategory } from './unit-category.entity';
import { Attribute } from './attribute.entity';
import { OperatorStock } from './operator-stock.entity';
import { OrderItems } from './order-item.entity';
import { Pricing } from './pricing.entity';
import { PurchaseItems } from './purchase-item.entity';
import { SaleItems } from './sale-item.entity';
import { Discount } from './discount.entity';
@Entity('items')
export class Item {
  @PrimaryColumn('uuid')
  id: string;
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  reorder_level: number;

  @Column()
  initial_stock: number;

  @Column()
  updated_initial_stock: number;

  @Column()
  categoryId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: true })
  can_be_purchased: boolean;

  @Column({ default: true })
  can_be_sold: boolean;

  @Column()
  quantity: number;

  @Column({ nullable: true })
  unitCategoryId: string;

  @Column({ nullable: true })
  defaultUomId: string;

  @Column({ nullable: true })
  purchaseUomId: string;

  @OneToMany(() => Attribute, (attribute) => attribute.items)
  attributes: Attribute[];

  @OneToMany(() => OperatorStock, (operatorStock) => operatorStock.item)
  operatorStock: OperatorStock[];

  @OneToMany(() => OrderItems, (orderItems) => orderItems.item)
  OrderItems: OrderItems[];

  @OneToMany(() => Pricing, (pricing) => pricing.item)
  pricing: Pricing[];

  @OneToMany(() => PurchaseItems, (purchaseItems) => purchaseItems.item)
  purchases: PurchaseItems[];

  @OneToMany(() => SaleItems, (saleItems) => saleItems.item)
  sales: SaleItems[];

  @OneToMany(() => Discount, (discount) => discount.items)
  discounts: Discount[];

  @ManyToOne(() => UOM, (uom) => uom.defaultUom)
  @JoinColumn({ name: 'defaultUomId' })
  defaultUom: UOM;

  @ManyToOne(() => Category, (category) => category.items)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToOne(() => UOM, (uom) => uom.purchaseUom)
  @JoinColumn({ name: 'purchaseUomId' })
  purchaseUom: UOM;

  @ManyToOne(() => UnitCategory, (unitCategory) => unitCategory.items)
  @JoinColumn({ name: 'unitCategoryId' })
  unitCategory: UnitCategory;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
