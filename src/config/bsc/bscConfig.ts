import { BSC, CrossChainConfig, KeyPair, TokenConfig } from '../type';
import usdt from './abis/usdt.json';

const key: KeyPair = {
  pubKey: process.env.PUBLIC_KEY || '',
  privKey: process.env.PRIVATE_KEY || '',
}

const tokens: TokenConfig[] = [
  // USDT
  {
    symbol: 'USDT',
    decimal: 18,
    contractAddress: '0x55d398326f99059fF775485246999027B3197955',
    abi: usdt
  }
];

const bscConfig: CrossChainConfig = {
  chain: BSC,
  rpcUrl: process.env.CHAIN_RPC || 'https://bsc-dataseed.binance.org',
  key: key,
  funders: process.env.FUNDERS ? process.env.FUNDERS?.split(',') : [],
  native: false,
  tokens: tokens,
}

export default bscConfig;