import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEX } from '../common/constant/dex';
import { TOKENS } from '../common/constant/tokens';
import { ChainId, Token, CurrencyAmount } from '@uniswap/sdk-core'
import { Pair, Route } from '@uniswap/v2-sdk'
import { ethers } from 'ethers';
import { ABI } from '../common/constant/abi';

class TokenInfo {
    address: string;
    name?: string;
    symbol?: string;
    decimals?: number;

    constructor(_address: string) {
        this.address = _address;
    }
}

@Injectable()
export class ContractService {
    private readonly logger = new Logger(ContractService.name);
    private provider: ethers.Provider;
    private cachedTokenInfo: Map<string, TokenInfo> = new Map();

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

    /**
     * 从DEX获取价格
     * @param dexName DEX名称
     * @param tokenA 代币A地址
     * @param tokenB 代币B地址
     */
    async getPriceFromDex(dexName: string, tokenA: string, tokenB: string) {
        let price: number;
        const tokenInfoA = new TokenInfo(tokenA);
        const tokenInfoB = new TokenInfo(tokenB);

        // 输入检查
        Object.values(TOKENS).forEach(token => {
            if (this.equalsIgnoreCase(token.address, tokenA)) {
                tokenInfoA.name = token.name;
                tokenInfoA.symbol = token.symbol;
                tokenInfoA.decimals = token.decimals;
            }
            if (this.equalsIgnoreCase(token.address, tokenB)) {
                tokenInfoB.name = token.name;
                tokenInfoB.symbol = token.symbol;
                tokenInfoB.decimals = token.decimals;
            }
        });
        Object.values(this.cachedTokenInfo)
            .forEach(token => {
                if (this.equalsIgnoreCase(token.address, tokenA)) {
                    tokenInfoA.name = token.name;
                    tokenInfoA.symbol = token.symbol;
                    tokenInfoA.decimals = token.decimals;
                }
                if (this.equalsIgnoreCase(token.address, tokenB)) {
                    tokenInfoB.name = token.name;
                    tokenInfoB.symbol = token.symbol;
                    tokenInfoB.decimals = token.decimals;
                }
            });
        // 检查代币信息，如果没有配置，就从链上获取
        await this.checkAndCacheToken(tokenInfoA);
        await this.checkAndCacheToken(tokenInfoB);

        // 目前只做了UniswapV2
        switch (dexName.toLowerCase()) {
            case DEX.UniswapV2.name.toLowerCase():
                price = await this.getPriceFromUniswapV2(tokenInfoA, tokenInfoB);
                break;
            default:
                this.logger.error(`Unsupported DEX: ${dexName}`);
                return;
        }
        return price;
    }

    /**
     * 检查代币信息，如果没有配置，就从链上获取，并缓存到`cachedTokenInfo`
     * @param tokenInfo 代币信息
     */
    private async checkAndCacheToken(tokenInfo: TokenInfo) {
        if (!tokenInfo.name || !tokenInfo.symbol || !tokenInfo.decimals) {
            this.logger.warn(`${tokenInfo.address} is not configured in TOKENS, fetch from mainnet.`);
            try {
                const tokenContract = new ethers.Contract(tokenInfo.address,
                    ABI.ERC20,
                    this.provider);
                const [name, symbol, decimals] = await Promise.all([
                    tokenContract.name(),
                    tokenContract.symbol(),
                    tokenContract.decimals(),
                ]);
                tokenInfo.name = name;
                tokenInfo.symbol = symbol;
                tokenInfo.decimals = decimals;
                this.cachedTokenInfo.set(tokenInfo.address, tokenInfo);
            } catch (error) {
                this.logger.error(`Failed to fetch token info for ${tokenInfo.address}. `, error);
            }
        }
    }

    private async getPriceFromUniswapV2(tokenInfoA: TokenInfo,
        tokenInfoB: TokenInfo): Promise<number> {
        const tokenA = new Token(
            ChainId.MAINNET,
            tokenInfoA.address,
            tokenInfoA.decimals || 18,
            tokenInfoA.symbol,
            tokenInfoA.name
        );
        const tokenB = new Token(
            ChainId.MAINNET,
            tokenInfoB.address,
            tokenInfoB.decimals || 18,
            tokenInfoB.symbol,
            tokenInfoB.name
        );

        try {
            const pairAddress = Pair.getAddress(tokenA, tokenB);
            const pairContract = new ethers.Contract(pairAddress, ABI.UniswapV2Pair, this.provider);
            const reserves = await pairContract["getReserves"]();
            const [reserve0, reserve1] = reserves;
            const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];
            const pair = new Pair(
                CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
                CurrencyAmount.fromRawAmount(token1, reserve1.toString())
            );
            const route = new Route([pair], tokenA, tokenB);
            return parseFloat(route.midPrice.toSignificant(18));
        } catch (error) {
            this.logger.error(`Could not get price for pair ${tokenInfoA.symbol}/${tokenInfoB.symbol}`, error);
            return -1;
        }
    }

    private equalsIgnoreCase(str1: string, str2: string): boolean {
        return str1.toLowerCase() == str2.toLowerCase();
    }
}
