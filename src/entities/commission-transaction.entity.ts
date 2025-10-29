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
import { Commission } from './commission.entity';

@Entity('commission_transactions')
export class CommissionTransaction {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  date: Date;

  @Column('float')
  amount: number;

  @Column('float')
  percentage: number;

  @Column()
  commissionId: string;

  @Column()
  paymentMethod: string;

  @Column()
  reference: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Commission, (commission) => commission.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'commissionId' })
  commission: Commission;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
