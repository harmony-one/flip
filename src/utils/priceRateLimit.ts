import { BigNumber, ethers } from "ethers";
import { getHighPrice, getLowPrice } from "./price";

export const CAP = 10; // $10 

// return [cappedAmount, remainder, conversionRate (lowPrice)]
export function limitToken(tokenAmountBN: BigNumber, decimal: number): [BigNumber, BigNumber, string] {
  const capBN = ethers.utils.parseUnits(CAP.toString(), decimal);
  let actualSendBN;
  let remainderBN;

  if (tokenAmountBN.gt(capBN)) {
    actualSendBN = capBN;
    remainderBN = tokenAmountBN.sub(capBN);
  } else {
    actualSendBN = tokenAmountBN;
    remainderBN = BigNumber.from(0);
  }

  return [actualSendBN, remainderBN, getLowPrice()!];
}

// return [cappedAmount, remainder, conversionRate (highPrice)]
export function limitOne(oneAmountBN: BigNumber): [BigNumber, BigNumber, string] {
  const capBN = calculateONEAmount(CAP);
  let actualSendBN;
  let remainderBN;

  if (oneAmountBN.gt(capBN)) {
    actualSendBN = capBN;
    remainderBN = oneAmountBN.sub(capBN);
  } else {
    actualSendBN = oneAmountBN;
    remainderBN = BigNumber.from(0);
  }

  return [actualSendBN, remainderBN, getHighPrice()!];
}

export function calculateONEAmount(dollarAmount: number): BigNumber {
  // convert the dollar amount to BigNumber, scaled up to match the 6 decimal places of the ONE price
  const dollarAmountBN = ethers.utils.parseUnits(dollarAmount.toFixed(2), 6);

  // convert the ONE price to BigNumber, assuming the price has 6 decimal places
  const onePriceUSDBN = ethers.utils.parseUnits(getHighPrice()!, 6);

  // calculate the number of ONE tokens as a BigNumber
  // dollar amount is scaled up by 10^18 to maintain precision during division
  return dollarAmountBN.mul(ethers.constants.WeiPerEther).div(onePriceUSDBN);
}