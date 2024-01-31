import { BASE, CrossChainConfig, KeyPair, TokenConfig } from '../type';
import usdc from './abis/usdc.json';

const key: KeyPair = {
  pubKey: process.env.PUBLIC_KEY || '',
  privKey: process.env.PRIVATE_KEY || '',
}

const tokens: TokenConfig[] = [
  // USDC
  {
    symbol: 'USDC',
    decimal: 6,
    contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    abi: usdc
  }
]

const baseConfig: CrossChainConfig = {
  chain: BASE,
  rpcUrl: process.env.CHAIN_RPC || 'https://mainnet.base.org',
  key: key,
  funders: process.env.FUNDERS ? process.env.FUNDERS?.split(',') : [],
  native: false,
  tokens: tokens,
}

export default baseConfig;