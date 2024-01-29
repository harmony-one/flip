import { ethers } from "ethers";
import { TransactionResponse } from "../types/customTypes";
import { BASE, BSC, ChainConfig, KeyPair } from "../config/type";
import { dstChain, harmonyManager } from "../server";

const INTERVAL = 500;
const MAX_RETRIES = 3;

export interface ExtendedTransactionResponse extends TransactionResponse {
  amount?: ethers.BigNumber;
  cappedAmount?: ethers.BigNumber;
  remainderAmount?: ethers.BigNumber;
  remainderValue?: number;
}

class HarmonyIndexer {
  protected provider: ethers.providers.JsonRpcProvider;
  protected lastBlockNum: number | null = null;
  private config: ChainConfig;
  private key: KeyPair;

  constructor(config: ChainConfig) {
    this.config = config;
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    this.key = config.key;
  }

  // TODO: multiple token address
  getTokenAddress(walletAddress: string): string {
    // if (walletAddress.toLowerCase() === process.env.BASE_ADDRESS!.toLowerCase()) {
    if (dstChain === BASE) {
      return '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base: USDC token address
    } else if (dstChain === BSC) {
      return '0x55d398326f99059fF775485246999027B3197955'; // BSC: USDT token address
    }
    return '';
  }

  start() {
    this.log('Starting Indexer');
    const processIndexing = async () => {
      let retryCount = 0;
      while (retryCount <= MAX_RETRIES) {
        try {
          const currBlockNum = await this.fetchBlockNum();
          if (this.lastBlockNum && this.lastBlockNum < currBlockNum) {
            for (let blockNum = this.lastBlockNum + 1; blockNum <= currBlockNum; blockNum++) {
              const newTxs = await this.fetchTxs(blockNum);
              for (const tx of newTxs) {
                try {
                  console.log(`Handling Tx: ${tx.hash}`);
                  const tokenAddress = this.getTokenAddress(tx.to!);
                  if (tokenAddress === '') {
                    throw new Error('Unknown token address');
                  }

                  harmonyManager.sendRequest(
                    tx.hash,
                    tx.from,
                    tokenAddress,
                    tx.value
                  );
                } catch (error) {
                  this.error(`Failed to process transaction: ${tx.hash}`, error as Error);
                }
              }
              this.lastBlockNum = blockNum;
              this.log(`Updated blockNum: ${blockNum}`);
            }
          }
          break; // break the loop on successful execution
        } catch (error) {
          this.error('Error during indexing:', error as Error);
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            this.log(`Retrying: attempt ${retryCount}/${MAX_RETRIES}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // exponential back-off
          } else {
            this.log('Max retries reached. Proceeding to next cycle.');
            break;
          }
        }
      }
      setTimeout(processIndexing, INTERVAL);
    }
    processIndexing();
  }

  protected async fetchBlockNum(): Promise<number> {
    const currBlockNum = await this.provider.getBlockNumber();
    if (this.lastBlockNum === null) {
      this.lastBlockNum = currBlockNum - 1;
    }
    return currBlockNum;
  }

  protected async fetchTxs(blockNum: number): Promise<ExtendedTransactionResponse[]> {
    const newTxs: ExtendedTransactionResponse[] = [];
    try {
      const block = await this.provider.getBlockWithTransactions(blockNum);
      var filteredTxs: TransactionResponse[];
      filteredTxs = block.transactions.filter(tx => {
        // TODO: into a single return
        if (tx.from && !this.isFundingAddr(tx.from) && tx.to) {
          return tx.to!.toLowerCase() === this.key.pubKey.toLowerCase()
            && tx.from.toLowerCase() !== this.key.pubKey.toLowerCase(); // ignore self transactions to prevent loop
        }
        return false;
      });
      newTxs.push(...filteredTxs);
    } catch (error) {
      this.error('Error fetching transactions', error as Error);
    }
    return newTxs;
  }

  protected log(message: string, ...args: any[]) {
    let logMessage = `[${this.config.chain}Indexer] ${message}`;
    if (args.length > 0) {
      logMessage += `${args.map(arg => JSON.stringify(arg)).join(' ')}`;
    }
    console.log(logMessage);
  }

  protected error(message: string, error: Error) {
    console.error(`[${this.config.chain}Indexer] ${message}:`, error);
  }

  protected isFundingAddr(address: string): boolean {
    return this.config.funders.some(funder => funder === address);
  }

  getProvider(): ethers.providers.JsonRpcProvider {
    return this.provider;
  }
}
export default HarmonyIndexer;