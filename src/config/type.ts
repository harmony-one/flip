const HARMONY = 'Harmony';
const BASE = 'Base';
const BSC = 'BSC';

// TODO: ensure the required values are loaded
interface ChainConfig {
  chain: string;
  rpcUrl: string;
  funders: string[];
  native: boolean; // set to true if accepting native asset
  key: KeyPair;
}
interface CrossChainConfig extends ChainConfig {
  tokens?: TokenConfig[];
}

interface KeyPair {
  pubKey: string,
  privKey: string
}

interface TokenConfig {
  symbol: string,
  decimal: number,
  contractAddress: string,
  abi: any;
}

export {
  ChainConfig, CrossChainConfig, KeyPair, TokenConfig,
  HARMONY, BASE, BSC
};