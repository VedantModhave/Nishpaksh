require('@nomicfoundation/hardhat-ethers')
require('dotenv').config({ path: '.env.local' })

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: '0.8.24',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      timeout: 120000, // 120 seconds timeout
      gasPrice: 'auto',
    },
  },
}

