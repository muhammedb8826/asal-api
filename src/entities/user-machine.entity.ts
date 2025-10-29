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

@Entity('user_machine')
@Unique(['machineId'])
export class UserMachine {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  machineId: string;

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
