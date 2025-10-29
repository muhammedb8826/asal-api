import { randomUUID } from 'crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  BeforeInsert,
} from 'typeorm';

@Entity('fixed_cost')
@Unique(['description'])
export class FixedCost {
  @PrimaryColumn('uuid')
  id: string;

  @Column('float')
  monthlyFixedCost: number;

  @Column('float')
  dailyFixedCost: number;

  @Column()
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
