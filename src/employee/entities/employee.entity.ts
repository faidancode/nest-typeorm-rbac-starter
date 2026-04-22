import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Department } from '../../department/entities/department.entity';
import { Position } from '../../position/entities/position.entity';
import { User } from '../../user/entities/user.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', unique: true, nullable: true })
  userId!: string | null;

  @Column({ name: 'department_id', nullable: true })
  departmentId!: string | null;

  @Column({ name: 'manager_id', nullable: true })
  managerId!: string | null;

  @Column({ name: 'full_name', length: 120 })
  fullName!: string;

  @Column({ unique: true, length: 30 })
  nip!: string;

  @Column()
  gender!: 'Laki-Laki' | 'Perempuan';

  @Column({ name: 'position_id' })
  positionId!: string;

  @Column({ name: 'date_of_joining', type: 'date' })
  dateOfJoining!: Date;

  @Column({ name: 'date_of_active_position', type: 'date' })
  dateOfActivePosition!: Date;

  @Column({ name: 'employee_status' })
  employeeStatus!: 'Permanen' | 'Kontrak';

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date | null;

  // Relations
  @OneToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'manager_id' })
  manager?: Employee;

  @ManyToOne(() => Position)
  @JoinColumn({ name: 'position_id' })
  position?: Position;
}
