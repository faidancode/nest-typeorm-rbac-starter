import { Injectable } from '@nestjs/common';
import { PermissionRepository } from '../repositories/permission.repository';

@Injectable()
export class PermissionService {
  constructor(private readonly repo: PermissionRepository) {}

  async findAll() {
    return this.repo.findAll();
  }
}
