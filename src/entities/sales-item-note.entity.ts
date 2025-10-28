import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SaleItems } from './sale-item.entity';

@Entity('sales_item_note')
@Index(['saleItemId'])
@Index(['userId'])
export class SalesItemNote {
  @PrimaryGeneratedColumn('uuid')
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
  saleItemId: string;

  @ManyToOne(() => SaleItems, (saleItem) => saleItem.saleItemNotes)
  @JoinColumn({ name: 'saleItemId' })
  saleItem: SaleItems;
}
