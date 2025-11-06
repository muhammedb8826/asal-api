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
import { Purchase } from './purchase.entity';
import { GrnItem } from './grn-item.entity';

@Entity('grns')
export class GRN {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  series: string;

  @Column()
  purchaseId: string;

  @CreateDateColumn()
  receivedDate: Date;

  @Column({ default: 'PENDING' })
  status: string; // PENDING, PARTIAL, COMPLETE

  @Column({ nullable: true })
  receivedBy: string; // userId

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => GrnItem, (grnItem) => grnItem.grn)
  grnItems: GrnItem[];

  @ManyToOne(() => Purchase)
  @JoinColumn({ name: 'purchaseId' })
  purchase: Purchase;

  @BeforeInsert()
  private setIdIfMissing(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
