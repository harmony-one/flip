# Flip

Flip is a minimal on-chain service enabling quick, cheap cross-chain swaps leveraging `.country` domains.

## Getting Started

### Prerequisites

- Node.js (v16.x recommended)
- PostgreSQL installed and accessible.
- Docker installed if you plan to use containerization.

### Installation

1. Clone the repository and go to '/moc/flip'
2. Install dependencies:

```sh
npm install
```

3. Set up your environment variables by copying the .env.example file to .env and filling it out:

```sh
cp .env.example .env
```

### Configuration

Modify the .env file with your specific settings:

- `CHAIN`: Specify the blockchain to interact with (e.g., "Base", "BSC").
- `PORT`: The port number for the Flip service.
- `PRICE_URL`: URL for fetching price data (default is set to Binance's API).
- `DB_CONNECTION_STRING`: Your PostgreSQL database connection string.
- `PUBLIC_KEY`, `PRIVATE_KEY`: Configuration for wallet transactions.
- `FUNDERS`: Whitelisted addresses to fund the account and not trigger the Flip transactions.
- `HARMONY_RPC`, `CHAIN_RPC`: RPC endpoints for blockchain interactions.

## Running the Application

For development:

```sh
npm run dev -- --chain=<chain>
```

To build and run in production:

```sh
npm run build
npm start -- --chain=<chain>
```

The `--chain` or `-c` flag is required to specify the destination blockchain.

## Docker Setup

The provided Dockerfile facilitates building a Docker image for Flip, encapsulating all dependencies and configurations for deployment.

1. Build the Docker image:

```sh
docker build -t flip .
```

2. Run the container, ensuring to pass the `CHAIN` environment variable:

```sh
docker run -p 3000:3000 flip
```

This Docker setup encapsulates the Flip service in a container, making it easy to deploy and scale across different environments.
