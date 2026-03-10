import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/index.js';
import { PrismaModule } from './modules/prisma/prisma.module.js';
import { TasksModule } from './modules/tasks/tasks.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: '.env',
    }),
    PrismaModule,
    TasksModule,
  ],
})
export class AppModule {}
