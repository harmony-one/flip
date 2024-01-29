import { ChainConfig, HARMONY, KeyPair } from './type';

const key: KeyPair = {
  pubKey: process.env.PUBLIC_KEY || '',
  privKey: process.env.PRIVATE_KEY || '',
}

const harmonyConfig: ChainConfig = {
  chain: HARMONY,
  rpcUrl: process.env.HARMONY_RPC || 'https://api.s0.t.hmny.io',
  key: key,
  funders: process.env.FUNDERS ? process.env.FUNDERS?.split(',') : [],
  native: true,
}

export default harmonyConfig;