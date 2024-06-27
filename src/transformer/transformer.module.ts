import { Module } from '@nestjs/common';
import { TransformerService } from './transformer.service';
import { UtilityService } from 'src/utils/utility.service';
import { GateWayModule } from 'src/gateway/gateway.module';

@Module({
  imports: [GateWayModule],
  providers: [TransformerService, UtilityService],
  exports: [TransformerService],
})
export class TransformerModule {}
