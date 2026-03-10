import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  TaskPriority,
  TaskStatus,
} from '../../../../generated/prisma/enums.js';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implementar funcionalidad de login' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    example: 'Crear flujo de autenticación basado en JWT',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.pending })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.medium })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;
}
