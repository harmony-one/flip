import { Pool } from 'pg';
import { readFile } from 'fs/promises';

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING
});

const checkTableExists = async (tableName: string): Promise<boolean> => {
  const queryText = `SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE  table_schema = 'public'
    AND    table_name   = $1
  );`;
  const res = await pool.query(queryText, [tableName]);
  return res.rows[0].exists;
};

const runSchemaFile = async (filePath: string) => {
  try {
    const sql = await readFile(filePath, { encoding: 'utf-8' });
    await pool.query(sql);
    console.log(`Successfully ran schema file: ${filePath}`);
  } catch (error) {
    console.error(`Error running schema file: ${filePath}`, error);
  }
};

const initDb = async () => {
  const tables = ['remainders', 'transactions'];
  for (const table of tables) {
    const exists = await checkTableExists(table);
    if (!exists) {
      await runSchemaFile(`./src/db/schemas/${table}.sql`);
    } else {
      console.log(`Table ${table} already exists`);
    }
  }
};

const query = (text: string, params?: any[]) => pool.query(text, params);

const getAllTransactions = async () => {
  const result = await query('SELECT * FROM transactions ORDER BY id DESC');
  return result.rows;
};

const getChainTransactions = async (chain: string) => {
  const result = await query('SELECT * FROM transactions WHERE src_chain = $1 OR dst_chain = $1 ORDER BY id DESC', [chain]);
  return result.rows;
}

const getAllRemainders = async () => {
  const result = await query('SELECT * FROM remainders ORDER BY id DESC');
  return result.rows;
};

const saveTransction = async (
  address: string, srcChain: string, srcHash: string, dstChain: string, dstHash: string, asset: string, amount: number) => {
  try {
    const insertQuery = `
      INSERT INTO transactions (address, src_chain, src_hash, dst_chain, dst_hash, asset, amount) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
    await query(insertQuery, [address, srcChain, srcHash, dstChain, dstHash, asset, amount]);
    console.log(`Transaction ${srcChain}: ${srcHash} / ${dstChain}: ${dstHash} saved to DB`);
  } catch (error) {
    console.error('Failed to save transaction', error as Error);
  }
}

const saveRemainder = async (
  address: string, dstChain: string, dstHash: string, asset: string, totalAmount: string, sentAmount: string, remainder: string, conversionRate: string) => {
  try {
    const insertQuery = `
    INSERT INTO remainders (address, chain, tx_hash, asset, total_amount, sent_amount, remainder, conversion_rate)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    await query(insertQuery, [address, dstChain, dstHash, asset, totalAmount, sentAmount, remainder, conversionRate]);
    console.log(`Remainder saved: ${dstHash}`);
  } catch (error) {
    console.error('Failed to save remainder', error as Error);
  }
}

export { initDb, getAllTransactions, getChainTransactions, getAllRemainders, saveTransction, saveRemainder };