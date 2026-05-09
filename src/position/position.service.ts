import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PositionRepository } from './repositories/position.repository';
import { Position } from './entities/position.entity';
import type {
  CreatePositionDto,
  UpdatePositionDto,
} from './schemas/position.schemas';
import { AuditService } from 'src/common/logging/audit.service';
import { TransactionService } from 'src/common/transactions/transaction.service';

@Injectable()
export class PositionService {
  constructor(
    private readonly positionRepo: PositionRepository,
    private readonly audit: AuditService,
    private readonly transaction: TransactionService,
  ) {}

  async create(data: CreatePositionDto): Promise<Position> {
    const saved = await this.transaction.run(async (manager) => {
      const repo = manager.getRepository(Position);
      const existing = await repo.findOne({
        where: { name: data.name },
      });
      if (existing) {
        throw new ConflictException('Position name already exists');
      }
      const position = repo.create(data);
      return repo.save(position);
    });

    this.audit.record({
      action: 'create',
      resource: 'position',
      resourceId: saved.id,
      after: saved,
    });

    return saved;
  }

  async findAll(): Promise<Position[]> {
    return await this.positionRepo.find();
  }

  async findOne(id: string): Promise<Position> {
    const position = await this.positionRepo.findOne({ where: { id } });
    if (!position) {
      throw new NotFoundException(`Position with ID ${id} not found`);
    }
    return position;
  }

  async update(id: string, data: UpdatePositionDto): Promise<Position> {
    const position = await this.findOne(id);
    const before = { ...position };
    const saved = await this.transaction.run(async (manager) => {
      const repo = manager.getRepository(Position);

      if (data.name && data.name !== position.name) {
        const existing = await repo.findOne({
          where: { name: data.name },
        });
        if (existing) {
          throw new ConflictException('New position name already exists');
        }
      }

      Object.assign(position, data);
      return repo.save(position);
    });

    this.audit.record({
      action: 'update',
      resource: 'position',
      resourceId: id,
      before,
      after: saved,
    });

    return saved;
  }

  async remove(id: string): Promise<void> {
    const position = await this.findOne(id);
    await this.transaction.run(async (manager) => {
      const repo = manager.getRepository(Position);
      await repo.softRemove(position);
    });

    this.audit.record({
      action: 'delete',
      resource: 'position',
      resourceId: id,
      before: position,
    });
  }
}
