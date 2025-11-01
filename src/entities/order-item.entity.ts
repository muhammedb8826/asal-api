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
import { Product } from './product.entity';
import { Order } from './order.entity';
import { UOM } from './uom.entity';

import { OrderItemNotes } from './order-item-notes.entity';

@Entity('order_items')
export class OrderItems {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  itemId: string;

  @Column({ nullable: true })
  serviceId: string;

  @Column({ nullable: true })
  nonStockServiceId: string;

  @Column({ default: false })
  isNonStockService: boolean;

  @Column('float', { nullable: true })
  width: number;

  @Column('float', { nullable: true })
  height: number;

  @Column('float', { nullable: true })
  discount: number;

  @Column()
  level: number;

  @Column('float')
  totalAmount: number;

  @Column()
  adminApproval: boolean;

  @Column()
  uomId: string;

  @Column()
  quantity: number;

  @Column('float')
  unitPrice: number;

  @Column({ nullable: true })
  description: string;

  @Column()
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  isDiscounted: boolean;

  @Column()
  baseUomId: string;

  @Column('float')
  unit: number;

  @Column('float', { default: 0 })
  totalCost: number;

  @Column('float', { default: 0 })
  sales: number;

  @OneToMany(() => OrderItemNotes, (orderItemNotes) => orderItemNotes.orderItem)
  orderItemNotes: OrderItemNotes[];

  @ManyToOne(() => Product, (product) => product.orderItems)
  @JoinColumn({ name: 'itemId' })
  product: Product;

  @ManyToOne(() => Order, (order) => order.orderItems)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => UOM, (uom) => uom.orderItems)
  @JoinColumn({ name: 'uomId' })
  uom: UOM;

  @ManyToOne(() => UOM, (baseUom) => baseUom.baseOrderItems)
  @JoinColumn({ name: 'baseUomId' })
  baseUom: UOM;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
