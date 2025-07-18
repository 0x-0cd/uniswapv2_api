export const ABI = {
    ERC20: [
        'function name() public view returns (string)',
        'function symbol() public view returns (string)',
        'function decimals() publicview returns (uint8)',
        'function transfer(address, uint256) public returns (bool)',
    ],
    UniswapV2Pair: [
        'function getReserves() public view returns (uint112, uint112, uint32)',
    ],
}