import { randomUUID } from 'crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { SaleItems } from './sale-item.entity';

@Entity('sales')
export class Sale {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  series: string;

  @Column()
  operatorId: string;

  @Column()
  status: string;

  @CreateDateColumn()
  orderDate: Date;

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  totalQuantity: number;

  @OneToMany(() => SaleItems, (saleItems) => saleItems.sale)
  saleItems: SaleItems[];

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
