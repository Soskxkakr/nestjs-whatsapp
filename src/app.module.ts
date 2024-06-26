import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule, PinoLogger } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GateWayModule } from './gateway/gateway.module';
import { ContactModule } from './contact/contact.module';
import { ChatModule } from './chat/chat.module';
import { MessageModule } from './message/message.module';
import { DatabaseModule } from './common/database.module';
import { FileModule } from './file/file.module';
import { UtilityModule } from './utils/utility.module';
import config from './config';
import { pinoConfig } from './utils/logger.config';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${process.cwd()}/.env${
        process.env.ENVIRONMENT ? `.${process.env.ENVIRONMENT}` : ''
      }`,
      load: [config],
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: pinoConfig,
    }),
    ChatModule,
    ContactModule,
    FileModule,
    DatabaseModule,
    GateWayModule,
    MessageModule,
    UtilityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PinoLogger,
    },
  ],
})
export class AppModule {}
