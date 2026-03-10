import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { QueryTasksDto } from './dto/query-tasks.dto.js';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryTasksDto) {
    try {
      return await this.prisma.task.findMany({
        where: {
          ...(query.status && { status: query.status }),
          ...(query.priority && { priority: query.priority }),
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      throw new InternalServerErrorException('Error al obtener las tareas');
    }
  }

  async create(dto: CreateTaskDto) {
    try {
      return await this.prisma.task.create({
        data: {
          title: dto.title,
          description: dto.description,
          status: dto.status,
          priority: dto.priority,
        },
      });
    } catch {
      throw new InternalServerErrorException('Error al crear la tarea');
    }
  }
}
