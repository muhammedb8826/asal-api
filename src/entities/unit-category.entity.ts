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
import { Item } from './item.entity';

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

  @OneToMany(() => Item, (item) => item.unitCategory)
  items: Item[];

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
