import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { BlockService } from './block.service';

@Controller('block')
export class BlockController {
    constructor(private readonly blockService: BlockService) { }

    @Get('latestBlockNumber')
    async getLatestBlockNumber() {
        return await this.blockService.getLatestBlockNumber();
    }

    @Get('blockByNumber/:blockNumber')
    async getBlockByNumber(@Param('blockNumber', ParseIntPipe) blockNumber: number) {
        return await this.blockService.getBlockByNumber(blockNumber);
    }

    @Get('largeTransfer/:blockNumber/:threshold')
    async getLargeTransfer(@Param('blockNumber', ParseIntPipe) blockNumber: number, @Param('threshold') threshold: string) {
        return await this.blockService.getEthTransfer(blockNumber, threshold);
    }
}
