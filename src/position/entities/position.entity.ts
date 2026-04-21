import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Department } from '../../department/entities/department.entity';

@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'department_id' })
  departmentId!: string;

  @Column({ unique: true, length: 100 })
  name!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;

  @ManyToOne(() => Department, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'department_id' })
  department?: Department;
}
