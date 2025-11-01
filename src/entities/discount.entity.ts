import { randomUUID } from 'crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  BeforeInsert,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('discounts')
@Unique(['itemId', 'level'])
export class Discount {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  level: number;

  @Column()
  itemId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('float')
  percentage: number;

  @Column('float')
  unit: number;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Product, (product) => product.discounts)
  @JoinColumn({ name: 'itemId' })
  product: Product;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
