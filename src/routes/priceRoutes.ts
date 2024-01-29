import express from 'express';
import { getPrice } from '../utils/price';

const router = express.Router();

router.get('/', async (_, res) => {
  try {
    const priceData = getPrice();
    res.json(priceData);
  } catch (error) {
    res.status(404).send('Price data not available');
  }
});

export default router;
