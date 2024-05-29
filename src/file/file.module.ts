import { Module } from '@nestjs/common';
import { GateWayModule } from 'src/gateway/gateway.module';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [GateWayModule, ConfigModule],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
