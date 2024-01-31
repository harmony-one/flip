import axios from 'axios';
import { ethers, BigNumber } from 'ethers';

const SYMBOL = 'ONEUSDT';
const INTERVAL = '1h';
const ONE_DECIMAL = 18;

let priceData: PriceData | null = null;

interface PriceData {
  openTime: number;
  closeTime: number;
  highPrice: string;
  lowPrice: string;
}

async function fetchPrice(): Promise<PriceData> {
  const startTime = Date.now() - (120 * 60 * 1000); // last 2 hours

  const params = {
    symbol: SYMBOL,
    interval: INTERVAL,
    startTime: startTime
  }

  try {
    const priceUrl = process.env.PRICE_URL;
    const response = await axios.get(priceUrl!, { params: params })
    const data = response.data;
    if (data.length == 0) {
      throw new Error('No price data available');
    }

    const recentPrice = data[data.length - 1];

    // update priceData with the fetched one
    priceData = {
      openTime: recentPrice[0],
      closeTime: recentPrice[6],
      highPrice: recentPrice[2],
      lowPrice: recentPrice[3]
    };

    return priceData;
  } catch (error) {
    console.error('Error fetching price data:', error);
    throw error;
  }
}

function getPrice(): PriceData | null {
  return priceData;
}

function getHighPrice(): string | undefined {
  return priceData?.highPrice;
}

function getLowPrice(): string | undefined {
  return priceData?.lowPrice;
}

function convertOneToToken(amount: BigNumber, decimal: number): BigNumber {
  const lowPrice = getLowPrice();
  if (!lowPrice) {
    throw new Error('Low price data not available');
  }
  const conversionRate = ethers.utils.parseUnits(lowPrice, decimal);
  return amount.mul(conversionRate).div(ethers.utils.parseUnits('1', ONE_DECIMAL));
}

function convertTokenToOne(amount: BigNumber, decimal: number): BigNumber {
  const highPrice = getHighPrice();
  if (!highPrice) {
    throw new Error('Price data not available');
  }
  const conversionRate = ethers.utils.parseUnits(highPrice, decimal);
  return amount.mul(ethers.utils.parseUnits('1', ONE_DECIMAL)).div(conversionRate);
}

function getNumberAmount(amount: string, decimal: number): number {
  const formattedAmount = ethers.utils.formatUnits(amount, decimal);
  return parseFloat(formattedAmount);
  // return  parseFloat(numberAmount.toFixed(6));
}

export { PriceData, fetchPrice, getPrice, getHighPrice, getLowPrice, convertOneToToken, convertTokenToOne, getNumberAmount };