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
@Entity('pricing')
export class Pricing {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  itemId: string;
  @Column('float')
  sellingPrice: number;

  @Column('float')
  costPrice: number;

  // Temporal versioning
  @Column({ type: 'date' })
  effectiveFrom: Date;

  @Column({ type: 'date', nullable: true })
  effectiveTo: Date | null;

  @Column({ default: true })
  isActive: boolean;

  // Optional pricing tiers
  @Column({ type: 'varchar', nullable: true })
  customerType: string | null; // 'retail', 'wholesale', 'vip'

  @Column('int', { nullable: true })
  minQuantity: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Product, (product) => product.pricing)
  @JoinColumn({ name: 'itemId' })
  product: Product;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
    if (!this.effectiveFrom) {
      this.effectiveFrom = new Date();
    }
    if (this.effectiveTo === undefined) {
      this.effectiveTo = null;
    }
    if (this.isActive === undefined) {
      this.isActive = true;
    }
  }
}
