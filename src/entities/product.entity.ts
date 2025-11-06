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
import { Pricing } from './pricing.entity';
import { PurchaseItems } from './purchase-item.entity';
import { SaleItems } from './sale-item.entity';
import { OrderItems } from './order-item.entity';
import { OperatorStock } from './operator-stock.entity';
import { Attribute } from './attribute.entity';
import { Discount } from './discount.entity';
@Entity('products')
export class Product {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  internalNote: string;

  @Column()
  reorderLevel: number;

  @Column()
  categoryId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: true })
  canBePurchased: boolean;

  @Column({ default: true })
  canBeSold: boolean;

  @Column({ default: 0 })
  quantity: number;

  @Column({ nullable: true })
  unitCategoryId: string;

  @Column({ nullable: true })
  defaultUomId: string;

  @Column({ nullable: true })
  purchaseUomId: string;

  @Column({ nullable: true })
  image: string;

  @Column({ default: 1, type: 'int' })
  version: number; // Optimistic locking for concurrent updates (starts at 1, increments on update)

  @OneToMany(() => Pricing, (pricing) => pricing.product)
  pricing: Pricing[];

  @OneToMany(() => PurchaseItems, (purchaseItems) => purchaseItems.product)
  purchases: PurchaseItems[];

  @OneToMany(() => SaleItems, (saleItems) => saleItems.product)
  sales: SaleItems[];

  @OneToMany(() => OrderItems, (orderItems) => orderItems.product)
  orderItems: OrderItems[];

  @OneToMany(() => OperatorStock, (operatorStock) => operatorStock.product)
  operatorStock: OperatorStock[];

  @OneToMany(() => Attribute, (attribute) => attribute.product)
  attributes: Attribute[];

  @OneToMany(() => Discount, (discount) => discount.product)
  discounts: Discount[];

  @ManyToOne(() => UOM, (uom) => uom.defaultUom)
  @JoinColumn({ name: 'defaultUomId' })
  defaultUom: UOM;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToOne(() => UOM, (uom) => uom.purchaseUom)
  @JoinColumn({ name: 'purchaseUomId' })
  purchaseUom: UOM;

  @ManyToOne(() => UnitCategory, (unitCategory) => unitCategory.products)
  @JoinColumn({ name: 'unitCategoryId' })
  unitCategory: UnitCategory;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}

// Alias for legacy Item references
export const Item = Product;
