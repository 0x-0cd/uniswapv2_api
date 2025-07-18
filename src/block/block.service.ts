import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { error } from 'console';
import { ethers } from 'ethers';

@Injectable()
export class BlockService {
    private readonly logger = new Logger(BlockService.name);
    private provider: ethers.Provider;
    private cachedGasPrice: string | null = null;
    private lastFetchTime: number = 0;
    private CACHE_TTL_MS: number = 5000;
    private getGas: boolean = false;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const rpcProvider = this.configService.get<string>('blockchain.rpcProvider');
        const rpcKey = this.configService.get<string>('blockchain.rpcKey');
        const gasCacheTtl = this.configService.get<number>('gasCacheTtl');
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
        this.CACHE_TTL_MS = gasCacheTtl!;

        // 持续的Gas监听
        setInterval(() => {
            if (this.getGas) {
                this.fetchAndCacheGasPrice().catch(error =>
                    this.logger.error('Interval error while fetching gas price:', error),
                );
            }
        }, this.CACHE_TTL_MS);
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
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: ethers.formatEther(tx.value)
            }));

        return filteredTxs;
    }

    /**
     * 获取Gas价格，LRU缓存避免RPC频繁调用
     */
    async getGasPrice() {
        if (this.cachedGasPrice &&
            Date.now() - this.lastFetchTime < this.CACHE_TTL_MS) {
            // 缓存未过期，直接返回
            this.logger.warn('Returning cached gas price');
            return this.cachedGasPrice;
        }
        // 缓存过期，重新获取
        await this.fetchAndCacheGasPrice();
        if (this.cachedGasPrice) {
            return this.cachedGasPrice;
        } else {
            this.logger.error('Failed to retrieve gas price and cache is empty.');
        }
    }

    /**
     * 获取并缓存当前Gas价格
     */
    private async fetchAndCacheGasPrice() {
        try {
            const feeData = await this.provider.getFeeData();
            if (!feeData?.gasPrice) {
                this.logger.warn('No gas price data available');
                return;
            }
            const gasPriceInGwei = ethers.formatUnits(feeData.gasPrice, 'gwei');
            this.cachedGasPrice = gasPriceInGwei;
            this.lastFetchTime = Date.now();
            this.logger.log(`Gas price: ${gasPriceInGwei} Gwei`);
        } catch (error) {
            this.logger.error('Failed to fetch gas price, ERROR: ', error);
        }
    }

    switchGetGasPrice() {
        this.getGas = !this.getGas;
    }
}
