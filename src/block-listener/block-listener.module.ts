import { Module } from '@nestjs/common';
import { BlockListenerController } from './block-listener.controller';
import { BlockListenerService } from './block-listener.service';

@Module({
  controllers: [BlockListenerController],
  providers: [BlockListenerService]
})
export class BlockListenerModule {}
