import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { TaskStatus } from '../../../../generated/prisma/enums.js';

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TaskStatus, description: 'Nuevo estado de la tarea' })
  @IsEnum(TaskStatus)
  @IsNotEmpty()
  status: TaskStatus;
}
