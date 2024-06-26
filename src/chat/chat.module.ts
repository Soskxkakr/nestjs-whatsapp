import { Module } from '@nestjs/common';
import { GateWayModule } from 'src/gateway/gateway.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DatabaseModule } from 'src/common/database.module';
import { UtilityModule } from 'src/utils/utility.module';

@Module({
  imports: [GateWayModule, DatabaseModule, UtilityModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
