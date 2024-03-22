import { Module } from '@nestjs/common';
import { GateWayModule } from 'src/gateway/gateway.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [GateWayModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
