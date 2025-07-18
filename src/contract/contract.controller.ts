import { Controller, Get, HttpStatus, Logger, Param, Res } from '@nestjs/common';
import { ContractService } from './contract.service';
import { isAddress } from 'ethers';
import { Response } from 'express';

@Controller('contract')
export class ContractController {
    private readonly logger = new Logger(ContractController.name);

    constructor(private readonly contractService: ContractService) { }

    /**
     * 返回代币价格： 
     * @param dexName 
     * @param tokenA 代币A合约地址
     * @param tokenB 代币B合约地址
     * @returns 代币A相对于代币B的价格
     */
    @Get('getPriceFromDex/:dexName/:tokenA/:tokenB')
    async getPriceFromDex(
        @Param('dexName') dexName: string,
        @Param('tokenA') tokenA: string,
        @Param('tokenB') tokenB: string,

        @Res() res: Response
    ) {
        try {
            if (!isAddress(tokenA) || !isAddress(tokenB)) {
                return res
                    .status(HttpStatus.BAD_REQUEST)
                    .json({ message: 'Invalid token address' });
            }

            const price = await this.contractService
                .getPriceFromDex(dexName, tokenA, tokenB);
            return res
                .status(HttpStatus.OK)
                .json({ price });
        } catch (error) {
            this.logger.error(`Error getting price from ${dexName}, `, error);
            if (error instanceof Error) {
                return res
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .json({
                        message: error.message
                    });
            } else {
                return res
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .json({
                        message: 'Unknown error.'
                    });
            }
        }
    }
}
