CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255),
    src_chain VARCHAR(100),
    src_hash VARCHAR(255),
    dst_chain VARCHAR(100),
    dst_hash VARCHAR(255),
    asset VARCHAR(100),
    amount NUMERIC(38, 18),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);