import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { GateWayModule } from 'src/gateway/gateway.module';
import { ContactService } from './contact.service';
import { DatabaseModule } from 'src/common/database.module';

@Module({
  imports: [GateWayModule, DatabaseModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
