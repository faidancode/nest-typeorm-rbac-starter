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

@Injectable()
export class PositionService {
  constructor(private readonly positionRepo: PositionRepository) {}

  async create(data: CreatePositionDto): Promise<Position> {
    const existing = await this.positionRepo.findOne({
      where: { name: data.name },
    });
    if (existing) {
      throw new ConflictException('Position name already exists');
    }
    const position = this.positionRepo.create(data);
    return await this.positionRepo.save(position);
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

    if (data.name && data.name !== position.name) {
      const existing = await this.positionRepo.findOne({
        where: { name: data.name },
      });
      if (existing)
        throw new ConflictException('New position name already exists');
    }

    Object.assign(position, data);
    return await this.positionRepo.save(position);
  }

  async remove(id: string): Promise<void> {
    const position = await this.findOne(id);
    await this.positionRepo.softRemove(position);
  }
}
