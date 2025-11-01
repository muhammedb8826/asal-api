import { randomUUID } from 'crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { Product } from './product.entity';
import { UOM } from './uom.entity';

@Entity('operator_stock')
export class OperatorStock {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  itemId: string;

  @Column()
  quantity: number;

  @Column({ nullable: true })
  description: string;

  @Column()
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  uomId: string;

  @Column()
  baseUomId: string;

  @Column('float')
  unit: number;

  @ManyToOne(() => Product, (product) => product.operatorStock)
  @JoinColumn({ name: 'itemId' })
  product: Product;

  @ManyToOne(() => UOM, (uom) => uom.operatorStock)
  @JoinColumn({ name: 'uomId' })
  uoms: UOM;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
