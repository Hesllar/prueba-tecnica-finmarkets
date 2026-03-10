import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { QueryTasksDto } from './dto/query-tasks.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto.js';

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

  async findOne(id: string) {
    try {
      const task = await this.prisma.task.findUnique({ where: { id } });
      if (!task) {
        throw new NotFoundException(`Tarea con ID "${id}" no encontrada`);
      }
      return task;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al obtener la tarea');
    }
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.findOne(id);
    try {
      return await this.prisma.task.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.priority !== undefined && { priority: dto.priority }),
        },
      });
    } catch {
      throw new InternalServerErrorException('Error al actualizar la tarea');
    }
  }

  async updateStatus(id: string, dto: UpdateTaskStatusDto) {
    await this.findOne(id);
    try {
      return await this.prisma.task.update({
        where: { id },
        data: { status: dto.status },
      });
    } catch {
      throw new InternalServerErrorException(
        'Error al actualizar el estado de la tarea',
      );
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.task.delete({ where: { id } });
    } catch {
      throw new InternalServerErrorException('Error al eliminar la tarea');
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
