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

@Entity('file_path')
@Unique(['description'])
export class FilePath {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  filePath: string;

  @Column()
  fileType: string;

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
