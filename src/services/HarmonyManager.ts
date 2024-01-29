import { BigNumber, ethers } from "ethers";
import { ChainConfig } from "../config/type";
import { convertOneToToken, getNumberAmount } from "../utils/price";
import { tokenConfigs } from "../config";
import { saveRemainder, saveTransction } from '../db/db';
import { limitToken } from '../utils/priceRateLimit';
import { generalManager, harmonyIndexer } from '../server';

interface RequestProps {
  srcChain: string,
  srcHash: string,
  dstAddress: string,
  amount: string,
  remainderInfo: {
    totalAmount: string,
    remainder: string,
    conversionRate: string,
  }
}

class HarmonyManager {
  private config: ChainConfig;
  private wallet: ethers.Wallet;

  constructor(config: ChainConfig) {
    this.config = config;
    this.wallet = new ethers.Wallet(config.key.privKey, harmonyIndexer.getProvider());
  }

  async sendRequest(srcHash: string, dstAddress: string, tokenAddress: string, amount: BigNumber) {
    const tokenConfig = tokenConfigs.get(tokenAddress);
    if (!tokenConfig) {
      console.error(`Token ${tokenAddress} not supported`);
      return;
    }

    const totalAmount = convertOneToToken(amount, tokenConfig.decimal);
    const [cappedAmount, remainder, conversionRate] = limitToken(totalAmount, tokenConfig.decimal);
    console.log(`Sender: ${dstAddress} / Token: ${tokenConfig.symbol} / Amount: ${totalAmount} / Capped: ${cappedAmount.toString()}`);

    try {
      const data = {
        srcHash: srcHash,
        dstAddress: dstAddress,
        tokenAddress: tokenAddress,
        amount: cappedAmount.toString(),
        remainderInfo: {
          totalAmount: totalAmount.toString(),
          remainder: remainder.toString(),
          conversionRate: conversionRate,
        }
      };

      // TODO: await or nah
      generalManager.handleRequest(data);

    } catch (error) {
      // TODO: revert transaction
      if (error instanceof Error) {
        console.error('Error sending request', error.message);
      } else {
        console.error('Error sending request');
      }
    }
  }

  async handleRequest({ srcChain, srcHash, dstAddress, amount, remainderInfo }: RequestProps) {
    try {
      const minGasPrice = ethers.utils.parseUnits('100', 'gwei'); // 100 GWEI
      const txRequest = {
        to: dstAddress,
        value: BigNumber.from(amount),
        gasPrice: minGasPrice
      };

      let estimatedGasLimit = await this.wallet.estimateGas(txRequest);
      const tx = {
        ...txRequest,
        gasLimit: estimatedGasLimit
      };

      const txResponse = await this.wallet.sendTransaction(tx);
      console.log('Handled Tx:', txResponse.hash);

      await saveTransction(
        dstAddress, srcChain, srcHash, this.config.chain, txResponse.hash, 'ONE', getNumberAmount(amount, 18)
      );

      const { totalAmount, remainder, conversionRate } = remainderInfo;
      if (BigNumber.from(remainder).gt(BigNumber.from(0))) {
        await saveRemainder(
          dstAddress, this.config.chain, txResponse.hash, 'ONE',
          ethers.utils.formatUnits(totalAmount, 18), ethers.utils.formatUnits(amount, 18), ethers.utils.formatUnits(remainder, 18), conversionRate
        );
      }
    } catch (error) {
      console.error('Error handling request:', error);
    }
  }
}

export default HarmonyManager;