import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GateWayModule } from './gateway/gateway.module';
import { ContactModule } from './contact/contact.module';
import { ChatModule } from './chat/chat.module';
import { MessageModule } from './message/message.module';
import { DatabaseModule } from './common/database.module';
import { ConfigModule } from '@nestjs/config';
import config from './config';
import { FileModule } from './file/file.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${process.cwd()}/.env${
        process.env.ENVIRONMENT ? `.${process.env.ENVIRONMENT}` : ''
      }`,
      load: [config],
      isGlobal: true,
    }),
    ChatModule,
    ContactModule,
    FileModule,
    DatabaseModule,
    GateWayModule,
    MessageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
