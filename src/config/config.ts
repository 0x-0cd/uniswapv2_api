export default () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    gasCacheTtl: parseInt(process.env.GAS_CACHE_TTL_MS || '5000', 10),
    blockchain: {
        rpcProvider: process.env.RPC_PROVIDER || 'Alchemy',
        rpcKey: process.env.RPC_API_KEY || '0',
    },
});  