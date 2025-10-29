import { randomUUID } from 'crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { OrderItems } from './order-item.entity';

@Entity('order_item_notes')
export class OrderItemNotes {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  text: string;

  @Column()
  hour: Date;

  @Column()
  date: Date;

  @Column()
  userId: string;

  @Column()
  orderItemId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => OrderItems, (orderItem) => orderItem.orderItemNotes)
  @JoinColumn({ name: 'orderItemId' })
  orderItem: OrderItems;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
