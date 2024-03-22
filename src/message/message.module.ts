import { Module } from '@nestjs/common';
import { GateWayModule } from 'src/gateway/gateway.module';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

@Module({
  imports: [GateWayModule],
  controllers: [MessageController],
  providers: [MessageService],
})
export class MessageModule {}
