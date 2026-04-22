import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { Position } from '../../position/entities/position.entity';

@Entity('position_histories')
export class PositionHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'employee_id' })
  employeeId!: string;

  @Column({ name: 'position_id' })
  positionId!: string;

  @Column({ name: 'date_of_active_position', type: 'date' })
  dateOfActivePosition!: Date;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @ManyToOne(() => Position)
  @JoinColumn({ name: 'position_id' })
  position?: Position;
}
