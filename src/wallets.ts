import * as bip39 from 'bip39'
import { derivePath } from 'ed25519-hd-key'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { grpcUrl } from './utils'
import * as splToken from '@solana/spl-token'

const SOL_COIN_ID = 501

export function getWalletByIndex(index: number) {
  const m = process.env.SOL_TEST_MNEMONIC!
  const seed = bip39.mnemonicToSeedSync(m).toString('hex')
  const derivedSeed = derivePath(`m/44'/${SOL_COIN_ID}'/${index}'/0'`, seed) // phantom规则
  return Keypair.fromSeed(derivedSeed.key)
}

export async function getWalletSolBalance(wallet: Keypair, rpc: string) {
  const connection = new Connection(rpc)
  const balance = await connection.getBalance(wallet.publicKey)
  console.log(`Wallet SOL balance: ${balance / 1e9} SOL`)
  return balance
}

// is better to use this function to get token balance
export async function getWalletTokenBalance(wallet: Keypair, token: string, rpc: string) {
  const connection = new Connection(rpc)
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, { mint: new PublicKey(token) })
  const pda = splToken.getAssociatedTokenAddressSync(new PublicKey(token), wallet.publicKey)
  console.log(await connection.getTokenAccountBalance(pda, 'processed'))
  let balance = 0
  tokenAccounts.value.forEach((account) => {
    balance += Number(account.account.data.parsed.info.tokenAmount.amount)
  })
  console.log(`Wallet token balance: ${balance}`)
  return balance
}

export async function getWalletPdaAccountTokenBalance(wallet: Keypair, token: string, rpc: string) {
  const conn = new Connection(rpc, { commitment: 'finalized' })
  const pdaAccount = splToken.getAssociatedTokenAddressSync(new PublicKey(token), wallet.publicKey)
  try {
    const accountData = await splToken.getAccount(conn, pdaAccount)
    console.log(`pda account token balance: ${accountData.amount}`)
    return accountData.amount
  } catch (err: any) {
    if (err.name === 'TokenAccountNotFoundError') {
      console.log(`pda account token balance: 0`)
      return 0
    } else {
      throw err
    }
  }
}

async function main() {
  const wallet = getWalletByIndex(0)
  console.log(`Wallet public key: ${wallet.publicKey.toString()}`)
  await getWalletSolBalance(wallet, grpcUrl)
  await getWalletTokenBalance(wallet, 'AY4x4syaUVouwdHghG8VFsoFf8bDo6kovEiKNUChxXaX', grpcUrl)
  await getWalletPdaAccountTokenBalance(wallet, 'AY4x4syaUVouwdHghG8VFsoFf8bDo6kovEiKNUChxXaX', grpcUrl)
}

main()
  .then(() => console.log('end'))
  .catch((err) => console.error(err))
