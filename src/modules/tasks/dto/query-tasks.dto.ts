import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import {
  TaskPriority,
  TaskStatus,
} from '../../../../generated/prisma/enums.js';

export class QueryTasksDto {
  @ApiPropertyOptional({
    enum: TaskStatus,
    description: 'Filtrar por estado de la tarea',
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    enum: TaskPriority,
    description: 'Filtrar por prioridad de la tarea',
  })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;
}
