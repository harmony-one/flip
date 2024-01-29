import express from 'express';
import cors from 'cors';
import { initDb } from './db/db';
import { fetchPrice } from './utils/price';

const dotenv = require('dotenv');
let envFile = '.env';
if (process.env.NODE_ENV === 'development') {
  envFile = '.env.dev';
}
console.log('Loading:', envFile);
dotenv.config({ path: envFile });

const app = express();
app.use(cors());
app.use(express.json());

// app.use(middleware);
// app.use('/api/someRoute', someRouteHandler);

// ensure to initialize db and fetch price prior to running the services

const PRICE_FETCH_INTERVAL = 60 * 60 * 1000; // 60 minutes

async function fetchPriceWithInterval(): Promise<void> {
  try {
    const priceData = await fetchPrice();
    console.log('Price data fetched: ', priceData);
  } catch (error) {
    console.error('Error fetching price data:', error);
  }
};


async function setupApp() {
  try {
    await initDb();
    await fetchPriceWithInterval();
    setInterval(fetchPriceWithInterval, PRICE_FETCH_INTERVAL);
    console.log("App setup completed.");
  } catch (error) {
    console.error("Error setting up the app:", error);
    process.exit(1);
  }
}

export { setupApp, app };