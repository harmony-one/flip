CREATE TABLE failed (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255),
    chain VARCHAR(100),
    tx_hash VARCHAR(255),
    asset VARCHAR(100),
    amount NUMERIC(38, 18),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);