import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GateWayModule } from './gateway/gateway.module';
import { ContactModule } from './contact/contact.module';
import { ChatModule } from './chat/chat.module';
import { MessageModule } from './message/message.module';
import { DatabaseModule } from './common/database.module';
import { FileModule } from './file/file.module';
import { UtilityModule } from './utils/utility.module';
import { TransformerModule } from './transformer/transformer.module';
import config from './config';

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
    UtilityModule,
    TransformerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
