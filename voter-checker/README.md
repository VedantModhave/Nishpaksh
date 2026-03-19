# Voter ID Checker - Next.js Application

A modern web application to check voter details from the Election Commission of India with blockchain-based voting system.

## Features

- 🎨 Beautiful, responsive UI with Tailwind CSS
- 🔒 CAPTCHA verification
- 📱 Mobile-friendly design
- ⚡ Fast Next.js API routes
- 🎯 Real-time voter data from ECI
- ⛓️ Blockchain voting on Ethereum (Hardhat Local or Sepolia Testnet)
- 🔐 EPIC-based unique voting (one vote per EPIC number)
- 📊 Real-time results dashboard with charts

## Setup

1. Install dependencies:
```bash
cd voter-checker
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

1. Enter your EPIC number (Voter ID)
2. Select your state
3. Enter the CAPTCHA text
4. Click "Search Voter Details"
5. View your voter information

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: ECI Gateway API
- **Blockchain**: Ethereum (Hardhat / Sepolia Testnet)
- **Smart Contracts**: Solidity
- **Web3**: Ethers.js v6
- **Charts**: Recharts

## Blockchain Setup

### Option 1: Local Hardhat Network (Development)

1. Start Hardhat node:
```bash
npm run chain
```

2. Deploy contract locally:
```bash
npm run deploy:local
```

3. Import test account to MetaMask (see `scripts/get-test-accounts.js`)

### Option 2: Sepolia Testnet (Production-like)

1. Get Sepolia ETH from faucets:
   - https://sepoliafaucet.com/
   - https://www.infura.io/faucet/sepolia

2. Configure `.env.local`:
```bash
SEPOLIA_RPC_URL=https://rpc.sepolia.org
PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_VOTING_CHAIN_ID=11155111
```

3. Deploy to Sepolia:
```bash
npm run deploy:sepolia
```

**See [SEPOLIA_SETUP.md](./SEPOLIA_SETUP.md) for detailed Sepolia setup guide.**

## API Endpoints

- `GET /api/generate-captcha` - Generate CAPTCHA image
- `POST /api/search-voter` - Search voter by EPIC number

## Deployment

Deploy to Vercel:

```bash
npm run build
vercel
```

## License

MIT

