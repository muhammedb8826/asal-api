import { randomUUID } from 'crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  BeforeInsert,
} from 'typeorm';
import { Item } from './item.entity';

@Entity()
@Unique(['name', 'itemId'])
export class Attribute {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  value: string;

  @Column()
  itemId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Item, (item) => item.attributes)
  items: Item;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
