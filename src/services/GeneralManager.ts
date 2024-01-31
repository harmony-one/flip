import { BigNumber, ethers } from "ethers";
import { tokenConfigs } from "../config";
import { CrossChainConfig, HARMONY } from "../config/type";
import { convertTokenToOne, getNumberAmount } from "../utils/price";
import { saveFailed, saveRemainder, saveTransction } from '../db/db';
import { limitOne } from '../utils/priceRateLimit';
import { generalIndexer, harmonyManager } from '../server';

interface RequestProps {
  srcHash: string,
  dstAddress: string,
  tokenAddress: string,
  amount: string,
  remainderInfo: {
    totalAmount: string,
    remainder: string,
    conversionRate: string,
  }
}

class GeneralManager {
  private config: CrossChainConfig;
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor(config: CrossChainConfig) {
    this.config = config;
    this.provider = generalIndexer.getProvider();
    this.wallet = new ethers.Wallet(config.key.privKey, generalIndexer.getProvider()); // TODO: manager relies on indexer
  }

  async sendRequest(srcHash: string, dstAddress: string, tokenAddress: string, amount: BigNumber) {
    const tokenConfig = tokenConfigs.get(tokenAddress);
    if (!tokenConfig) {
      console.error(`Token ${tokenAddress} not supported`);
      return;
    }

    const totalAmount = convertTokenToOne(amount, tokenConfig.decimal);
    const [cappedAmount, remainder, conversionRate] = limitOne(totalAmount);
    console.log(`Sender: ${dstAddress} / Token: ONE / Amount: ${totalAmount.toString()} / Capped: ${cappedAmount.toString()}`);

    try {
      const data = {
        srcChain: this.config.chain,
        srcHash: srcHash,
        dstAddress: dstAddress,
        tokenAddress: tokenAddress,
        amount: cappedAmount.toString(),
        remainderInfo: {
          totalAmount: totalAmount.toString(),
          remainder: remainder.toString(),
          conversionRate: conversionRate,
        }
      }

      await harmonyManager.handleRequest(data);

    } catch (error) {
      // save failed transaction to manually process refund
      await saveFailed(dstAddress, this.config.chain, srcHash, tokenConfig.symbol, getNumberAmount(amount.toString(), tokenConfig.decimal));
      if (error instanceof Error) {
        console.error('Error sending request', error.message);
      } else {
        console.error('Error sending request');
      }
    }
  }

  async handleRequest({ srcHash, dstAddress, tokenAddress, amount, remainderInfo }: RequestProps) {
    try {
      const tokenContract = generalIndexer.getTokenContract(tokenAddress);
      const tokenConfig = tokenConfigs.get(tokenAddress);
      if (!tokenContract || !tokenConfig) {
        console.error(`Token ${tokenAddress} not setup`);
        return;
      }

      const gasPrice = await this.provider.getGasPrice();
      const tx = await tokenContract
        .connect(this.wallet)
        .transfer(dstAddress, amount, { gasPrice: gasPrice });

      console.log('Handled Tx:', tx.hash);

      await saveTransction(
        dstAddress, HARMONY, srcHash, this.config.chain, tx.hash, tokenConfig.symbol, getNumberAmount(amount, tokenConfig.decimal)
      );

      const { totalAmount, remainder, conversionRate } = remainderInfo;
      if (BigNumber.from(remainder).gt(BigNumber.from(0))) {
        saveRemainder(
          dstAddress, this.config.chain, tx.hash, tokenConfig.symbol,
          ethers.utils.formatUnits(totalAmount, tokenConfig.decimal), ethers.utils.formatUnits(amount, tokenConfig.decimal), ethers.utils.formatUnits(remainder, tokenConfig.decimal), conversionRate
        );
      }

    } catch (error) {
      console.error('Error handling request:', error);
      throw error;
    }
  }
}

export default GeneralManager;