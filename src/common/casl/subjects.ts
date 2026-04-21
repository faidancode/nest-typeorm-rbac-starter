import { Department } from 'src/department/entities/department.entity';
import { Employee } from 'src/employee/entities/employee.entity';
import { Position } from 'src/position/entities/position.entity';
import { User } from 'src/user/entities/user.entity';

export type SubjectObject = {
  __type: string;
} & Record<string, unknown>;

export type Subjects =
  | typeof User
  | typeof Department
  | typeof Employee
  | typeof Position
  | 'user'
  | 'department'
  | 'employee'
  | 'position'
  | 'role'
  | SubjectObject
  | 'all';
