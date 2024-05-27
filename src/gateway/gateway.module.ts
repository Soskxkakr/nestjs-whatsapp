import { Module } from '@nestjs/common';
import { Gateway } from './gateway.socket';

@Module({
  imports: [],
  providers: [Gateway],
  exports: [Gateway],
})
export class GateWayModule {}
