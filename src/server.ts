import { setupApp, app } from './app';
import { chainConfig, harmonyConfig } from './config/index';
import GeneralIndexer from './indexers/GeneralIndexer';
import HarmonyIndexer from './indexers/HarmonyIndexer';
import HarmonyManager from './services/HarmonyManager';
import GeneralManager from './services/GeneralManager';
import { getAllRemainders, getChainTransactions } from './db/db';

const PORT = process.env.PORT! || 3000;

function setupIndexerAndManager() {
  harmonyIndexer = new HarmonyIndexer(harmonyConfig);
  harmonyManager = new HarmonyManager(harmonyConfig);
  generalIndexer = new GeneralIndexer(chainConfig);
  generalManager = new GeneralManager(chainConfig);
  dstChain = chainConfig.chain;
}

function setupRoutes() {
  app.get('/health', (_, res) => res.send('ok'));
  app.get('/txs', async (_, res) => res.json(await getChainTransactions(chainConfig.chain)));
  app.get('/remainders', async (_, res) => res.json(await getAllRemainders()));
}

async function startServer() {
  await setupApp();
  setupRoutes();
  setupIndexerAndManager();
  harmonyIndexer.start();
  generalIndexer.start();

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer().catch(error => {
  console.error("Failed to start the server:", error);
});

export var harmonyIndexer: HarmonyIndexer;
export var harmonyManager: HarmonyManager;
export var generalIndexer: GeneralIndexer;
export var generalManager: GeneralManager;
export var dstChain: string;