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
  Index,
  Check,
} from 'typeorm';
import { UnitCategory } from './unit-category.entity';
import { OperatorStock } from './operator-stock.entity';
import { OrderItems } from './order-item.entity';
import { PurchaseItems } from './purchase-item.entity';
import { SaleItems } from './sale-item.entity';
import { Item } from './item.entity';

@Entity('uom')
@Unique(['name', 'abbreviation', 'unitCategoryId'])
@Index(['unitCategoryId'])
@Check('CHK_UOM_CONVERSION_RATE_POSITIVE', '"conversionRate" > 0')
export class UOM {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  abbreviation: string;

  // Multiplier to convert entered quantity into base-unit quantity
  // Example: if base is Kilogram, Gram.conversionRate = 0.001
  @Column('decimal', { precision: 18, scale: 9 })
  conversionRate: string;

  @Column({ default: false })
  baseUnit: boolean;

  @Column()
  unitCategoryId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OperatorStock, (operatorStock) => operatorStock.uoms)
  operatorStock: OperatorStock[];

  @OneToMany(() => OrderItems, (orderItems) => orderItems.uom)
  orderItems: OrderItems[];

  @OneToMany(() => OrderItems, (baseOrderItems) => baseOrderItems.baseUom)
  baseOrderItems: OrderItems[];

  @OneToMany(() => PurchaseItems, (purchaseItems) => purchaseItems.uoms)
  purchaseItems: PurchaseItems[];

  @OneToMany(() => SaleItems, (saleItems) => saleItems.uoms)
  saleItems: SaleItems[];

  @ManyToOne(() => UnitCategory, (unitCategory) => unitCategory.uoms)
  @JoinColumn({ name: 'unitCategoryId' })
  unitCategory: UnitCategory;

  @OneToMany(() => Item, (item) => item.defaultUom)
  defaultUom: Item[];

  @OneToMany(() => Item, (item) => item.purchaseUom)
  purchaseUom: Item[];

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  // Helper: convert a quantity to base-unit quantity using this UOM
  toBase(quantity: number): number {
    const rate = Number(this.conversionRate);
    return quantity * rate;
  }
}
