import { Module } from '@nestjs/common';
import { Gateway } from './gateway.socket';

@Module({
  providers: [Gateway],
  exports: [Gateway],
})
export class GateWayModule {}
