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
import { Sale } from './sale.entity';
import { UOM } from './uom.entity';
import { SalesItemNote } from './sales-item-note.entity';

@Entity('sale_items')
export class SaleItems {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  saleId: string;

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

  @ManyToOne(() => Product, (product) => product.sales)
  @JoinColumn({ name: 'itemId' })
  product: Product;

  @ManyToOne(() => Sale, (sale) => sale.saleItems)
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @ManyToOne(() => UOM, (uom) => uom.saleItems)
  @JoinColumn({ name: 'uomId' })
  uoms: UOM;

  @OneToMany(() => SalesItemNote, (salesItemNote) => salesItemNote.saleItem)
  saleItemNotes: SalesItemNote[];

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
