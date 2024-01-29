import { ethers } from "ethers";
import { TransactionResponse } from "../types/customTypes";
import { CrossChainConfig, TokenConfig } from "../config/type";
import { generalManager } from "../server";

const INTERVAL = 500;
const MAX_RETRIES = 3;

export interface ExtendedTransactionResponse extends TransactionResponse {
  amount?: ethers.BigNumber;
  cappedAmount?: ethers.BigNumber;
  remainderAmount?: ethers.BigNumber;
  remainderValue?: number;
}

class GeneralIndexer {
  protected provider: ethers.providers.JsonRpcProvider;
  protected lastBlockNum: number | null = null;
  private config: CrossChainConfig;
  private tokenMap: Map<String, TokenConfig> = new Map();
  private contractMap: Map<String, ethers.Contract> = new Map();

  constructor(config: CrossChainConfig) {
    this.config = config;
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    if (config.tokens) {
      config.tokens.forEach(token => {
        this.tokenMap.set(token.contractAddress.toLowerCase(), token);
        this.contractMap.set(token.contractAddress, new ethers.Contract(token.contractAddress, token.abi));
      });
    }
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
                  generalManager.sendRequest(
                    tx.hash,
                    tx.from,
                    tx.to!,
                    tx.amount!
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
      // harmony specific

      filteredTxs = block.transactions.filter(tx =>
        tx.to && this.tokenMap.has(tx.to.toLowerCase())
        && tx.from && !this.isFundingAddr(tx.from) && tx.from.toLowerCase() !== this.config.key.pubKey.toLowerCase() // ignore self transactions to prevent loop
      );

      // get all receipts in parallel
      const receiptPromises = filteredTxs.map(tx =>
        this.provider.getTransactionReceipt(tx.hash).catch(error => {
          this.error(`Error parsing transaction ${tx.hash}`, error);
          return null; // return null or a default value in case of error
        })
      );
      const receipts = await Promise.all(receiptPromises);

      receipts.forEach((receipt, index) => {
        if (receipt) {
          const contract = this.contractMap.get(receipt.to);
          if (contract) {
            receipt.logs.forEach(log => {
              try {
                const parsedLog = contract.interface.parseLog(log);
                if (parsedLog.name === 'Transfer'
                  && parsedLog.args.to.toLowerCase() === this.config.key.pubKey.toLowerCase()) {
                  newTxs.push({
                    ...filteredTxs[index],
                    amount: parsedLog.args.value, // include the transferred amount
                  });
                }
              } catch (parseError) {
                this.error(`Error parsing log for transaction ${filteredTxs[index].hash}`, parseError as Error);
              }
            });
          }
        }
      });

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

  getTokenContract(tokenAddress: string): ethers.Contract | undefined {
    return this.contractMap.get(tokenAddress);
  }
}

export default GeneralIndexer;