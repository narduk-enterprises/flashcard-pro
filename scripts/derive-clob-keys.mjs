/**
 * Derive Polymarket CLOB API credentials from a private key.
 * Uses the official @polymarket/clob-client SDK with ethers v5.
 * 
 * Usage:
 *   node scripts/derive-clob-keys.mjs <PRIVATE_KEY>
 */
import { ClobClient } from '@polymarket/clob-client'
import { Wallet } from '@ethersproject/wallet'
import { JsonRpcProvider } from '@ethersproject/providers'

const CLOB_BASE = 'https://clob.polymarket.com'
const CHAIN_ID = 137 // Polygon mainnet
const RPC = 'https://polygon-rpc.com'

const pk = process.argv[2]
if (!pk) {
  console.error('Usage: node scripts/derive-clob-keys.mjs <PRIVATE_KEY>')
  process.exit(1)
}

// ethers v5 Wallet connected to Polygon
const provider = new JsonRpcProvider(RPC)
const wallet = new Wallet(pk, provider)

console.log(`Wallet address: ${wallet.address}`)
console.log('Initializing CLOB client...')

const client = new ClobClient(CLOB_BASE, CHAIN_ID, wallet)

console.log('Deriving API key (createOrDeriveApiKey)...')
try {
  const creds = await client.createOrDeriveApiKey()
  console.log('\n=== Polymarket CLOB API Credentials ===')
  console.log(JSON.stringify(creds, null, 2))

  if (creds.apiKey) {
    console.log('\n--- For Doppler / ENV ---')
    console.log(`POLYMARKET_API_KEY=${creds.apiKey}`)
    console.log(`POLYMARKET_SECRET=${creds.secret}`)
    console.log(`POLYMARKET_PASSPHRASE=${creds.passphrase}`)
  }
} catch (err) {
  console.error('Failed to derive API key:', err.message || err)
  console.error(err)
}
