import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class BlockService {
    private readonly logger = new Logger(BlockService.name);
    private provider: ethers.Provider;

    constructor(private configService: ConfigService) { }
    onModuleInit() {
        const rpcProvider = this.configService.get<string>('blockchain.rpcProvider');
        const rpcKey = this.configService.get<string>('blockchain.rpcKey');
        switch (rpcProvider) {
            case 'Alchemy':
                this.provider = new ethers.AlchemyProvider('mainnet', rpcKey);
                break;
            case 'Infura':
                this.provider = new ethers.InfuraProvider('mainnet', rpcKey);
                break;
            default:
                this.logger.error(`Unsupported RPC provider: ${rpcProvider}`);
        }
    }

    async getLatestBlockNumber() {
        return await this.provider.getBlockNumber();
    }

    async getBlockByNumber(blockNumber: number) {
        try {
            const block = await this.provider.getBlock(blockNumber);
            return block;
        } catch (error) {
            this.logger.error(`Block ${blockNumber} not found`);
        }
    }

    /**
     * 获取指定区块中大于指定阈值的ETH转账交易
     */
    async getEthTransfer(blockNumber: number, threshold: string) {
        let block;
        try {
            block = await this.provider.getBlock(blockNumber, true);
        } catch (error) {
            this.logger.error(`Block ${blockNumber} not found`);
            return [];
        }

        const thresholdInWei = ethers.parseEther(threshold.toString());

        const filteredTxs = block.prefetchedTransactions
            .filter(tx => tx && tx.value > thresholdInWei)
            .map(tx => ({
                from: tx.from,
                to: tx.to,
                value: ethers.formatEther(tx.value)
            }));

        return filteredTxs;
    }
}
