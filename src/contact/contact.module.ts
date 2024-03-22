import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { GateWayModule } from 'src/gateway/gateway.module';
import { ContactService } from './contact.service';

@Module({
  imports: [GateWayModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
