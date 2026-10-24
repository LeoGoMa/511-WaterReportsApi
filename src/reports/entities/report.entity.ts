import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('WATER_REPORT')
export class Report {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 200 })
  address!: string;

  @Column({ type: 'varchar', length: 500 })
  description!: string;

  @Column({ type: 'varchar', length: 10 })
  severity!: string;

  @Column({ type: 'varchar', length: 20 })
  reporterPhone!: string;

  @Column({ type: 'boolean', default: false })
  isResolved!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  photoUrl!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  repairPhotoUrl!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
