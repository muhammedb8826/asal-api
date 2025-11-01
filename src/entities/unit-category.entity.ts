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
import { UOM } from './uom.entity';
import { Product } from './product.entity';

@Entity('unit_category')
export class UnitCategory {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  constant: boolean;

  @Column('float')
  constantValue: number;

  @OneToMany(() => UOM, (uom) => uom.unitCategory)
  uoms: UOM[];

  @OneToMany(() => Product, (product) => product.unitCategory)
  products: Product[];

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
