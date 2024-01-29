import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { BASE, BSC, CrossChainConfig, TokenConfig } from './type';
import harmonyConfig from './harmonyConfig';
import bscConfig from './bsc/bscConfig';
import baseConfig from './base/baseConfig';

const argv = yargs(hideBin(process.argv))
  .option('chain', {
    alias: 'c',
    describe: 'Select the blockchain',
    type: 'string',
    demandOption: true
  })
  .parseSync();


// TODO: ensure all required env variables are set
let chainConfig: CrossChainConfig;
const chain = argv.chain ? argv.chain.toLowerCase() : '';

// TODO: tokenConfigs only for harmony
function loadTokenConfigs(): Map<String, TokenConfig> {
  const tokenConfigs = new Map();
  const chainConfigs = [bscConfig, baseConfig]; // NOTE: add chain config here

  chainConfigs.forEach((chainConfig) => {
    chainConfig.tokens?.forEach((tokenConfig) => {
      tokenConfigs.set(tokenConfig.contractAddress, tokenConfig);
    })
  })

  return tokenConfigs;
}
// chances of the contract addresses deployed in different chains being same is astronomically low
const tokenConfigs: Map<String, TokenConfig> = loadTokenConfigs(); // map[contract address] = token config

switch (chain) {
  case BSC.toLowerCase():
    chainConfig = bscConfig;
    break;
  case BASE.toLowerCase():
    chainConfig = baseConfig;
    break;
  default:
    throw new Error('Invalid or no blockchain specified. Use --chain to specify the blockchain.');
}

export { chainConfig, harmonyConfig, tokenConfigs };
