import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GateWayModule } from './gateway/gateway.module';
import { ContactModule } from './contact/contact.module';
import { ChatModule } from './chat/chat.module';
import { MessageModule } from './message/message.module';

@Module({
  imports: [ChatModule, ContactModule, GateWayModule, MessageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
