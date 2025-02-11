import {
  clusterApiUrl,
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from '@solana/web3.js'
import { create, buy, sell } from './idl/instructions'
import { PROGRAM_ID } from './idl/programId'
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { PROGRAM_ID as METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata'
import { getWalletByIndex, getWalletTokenBalance } from '../wallets'
import { BondingCurve, Global } from './idl/accounts'
import BN from 'bn.js'
import { sleep } from '../utils'
import { sol } from '@metaplex-foundation/js'

export const GLOBAL_ACCOUNT_SEED = 'global'
export const MINT_AUTHORITY_SEED = 'mint-authority'
export const BONDING_CURVE_SEED = 'bonding-curve'
export const METADATA_SEED = 'metadata'

export class PumpFun {
  public conn: Connection

  static mintAuthority = PublicKey.findProgramAddressSync([Buffer.from(MINT_AUTHORITY_SEED)], PROGRAM_ID)[0]
  static global = PublicKey.findProgramAddressSync([Buffer.from(GLOBAL_ACCOUNT_SEED)], PROGRAM_ID)[0]
  feeRecipient: PublicKey | undefined

  constructor(rpc?: string) {
    this.conn = new Connection(rpc ?? clusterApiUrl('devnet'))
    this.updateFeeRecipient().then(() => setInterval(() => this.updateFeeRecipient(), 60 * 1000))
  }

  async updateFeeRecipient() {
    const globalAccount = await this.getGlobalAccount()
    this.feeRecipient = globalAccount.feeRecipient
    console.log(this.feeRecipient.toBase58(), 'feeRecipient')
  }

  static generatePumpToken() {
    while (true) {
      const tokens = Array.from({ length: 1000 }).map(() => Keypair.generate())
      console.log(tokens[999].publicKey.toBase58())
      const token = tokens.find((token) => token.publicKey.toBase58().endsWith('pump'))
      if (token) {
        return token
      }
    }
  }

  static getBondingCurve(mint: PublicKey) {
    return PublicKey.findProgramAddressSync([Buffer.from(BONDING_CURVE_SEED), mint.toBuffer()], PROGRAM_ID)[0]
  }

  static calWithSlippageSell(solAmount: bigint, slippageRate: number) {
    return new BN(solAmount.toString()).sub(new BN(solAmount.toString()).mul(new BN(slippageRate)).div(new BN(10000)))
  }

  static calWithSlippageBuy(solAmount: bigint, slippageRate: number) {
    return new BN(solAmount.toString()).add(new BN(solAmount.toString()).mul(new BN(slippageRate)).div(new BN(10000)))
  }

  async createAndBuy(
    mint: Keypair,
    name: string,
    symbol: string,
    uri: string,
    creater: Keypair,
    buyAmountSol: bigint = 0n,
    confirmOptions?: ConfirmOptions
  ) {
    const createAccounts = {
      mint: mint.publicKey,
      mintAuthority: PumpFun.mintAuthority,
      bondingCurve: PumpFun.getBondingCurve(mint.publicKey),
      associatedBondingCurve: getAssociatedTokenAddressSync(
        mint.publicKey,
        PumpFun.getBondingCurve(mint.publicKey),
        true
      ),
      global: PumpFun.global,
      mplTokenMetadata: METADATA_PROGRAM_ID,
      metadata: PublicKey.findProgramAddressSync(
        [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), mint.publicKey.toBuffer()],
        METADATA_PROGRAM_ID
      )[0],
      user: creater.publicKey,
      systemProgram: new PublicKey('11111111111111111111111111111111'),
      tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
      rent: new PublicKey('SysvarRent111111111111111111111111111111111'),
      eventAuthority: new PublicKey('Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1'),
      program: PROGRAM_ID,
    }
    const transaction = new Transaction().add(create({ name, symbol, uri }, createAccounts))

    if (buyAmountSol > 0n) {
      const buyTokenAmount = this.getInitTokenAmountBySol(buyAmountSol, await this.getGlobalAccount())
      console.log(buyTokenAmount.toString(), 'buyTokenAmount')
      const maxSolCost = buyAmountSol
      const buyerPda = getAssociatedTokenAddressSync(mint.publicKey, creater.publicKey)
      const buyAccounts = {
        global: PumpFun.global,
        feeRecipient: this.feeRecipient!,
        mint: mint.publicKey,
        bondingCurve: PumpFun.getBondingCurve(mint.publicKey),
        associatedBondingCurve: getAssociatedTokenAddressSync(
          mint.publicKey,
          PumpFun.getBondingCurve(mint.publicKey),
          true
        ),
        associatedUser: buyerPda,
        user: creater.publicKey,
        systemProgram: new PublicKey('11111111111111111111111111111111'),
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        rent: new PublicKey('SysvarRent111111111111111111111111111111111'),
        eventAuthority: new PublicKey('Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1'),
        program: PROGRAM_ID,
      }
      transaction.add(
        createAssociatedTokenAccountInstruction(creater.publicKey, buyerPda, creater.publicKey, mint.publicKey),
        buy({ amount: buyTokenAmount, maxSolCost: new BN(maxSolCost.toString()) }, buyAccounts)
      )
    }

    const tx = await sendAndConfirmTransaction(this.conn, transaction, [creater, mint], confirmOptions)
    console.log('Token created and buy:', mint.publicKey.toBase58(), tx)
  }

  async buy(mint: PublicKey, buyer: Keypair, solAmount: bigint, slippageRate = 500, confirmOptions?: ConfirmOptions) {
    const buyTokenAmount = this.getTokenAmountBySol(solAmount, await this.getBondingCurveAccount(mint))
    const maxSolCost = PumpFun.calWithSlippageBuy(solAmount, slippageRate)
    const buyerPda = getAssociatedTokenAddressSync(mint, buyer.publicKey)
    const buyAccounts = {
      global: PumpFun.global,
      feeRecipient: this.feeRecipient!,
      mint: mint,
      bondingCurve: PumpFun.getBondingCurve(mint),
      associatedBondingCurve: getAssociatedTokenAddressSync(mint, PumpFun.getBondingCurve(mint), true),
      associatedUser: buyerPda,
      user: buyer.publicKey,
      systemProgram: new PublicKey('11111111111111111111111111111111'),
      tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      rent: new PublicKey('SysvarRent111111111111111111111111111111111'),
      eventAuthority: new PublicKey('Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1'),
      program: PROGRAM_ID,
    }
    const transaction = new Transaction()
    if ((await this.conn.getAccountInfo(buyerPda)) === null) {
      transaction.add(createAssociatedTokenAccountInstruction(buyer.publicKey, buyerPda, buyer.publicKey, mint))
    }
    transaction.add(buy({ amount: buyTokenAmount, maxSolCost: new BN(maxSolCost.toString()) }, buyAccounts))
    const tx = await sendAndConfirmTransaction(this.conn, transaction, [buyer], confirmOptions)
    console.log('Token buy', tx)
  }

  async sell(
    mint: PublicKey,
    seller: Keypair,
    sellAmount: bigint,
    slippageRate = 10000,
    confirmOptions?: ConfirmOptions
  ) {
    const sellTokenAmount = sellAmount
    const minSolOutput = this.getSolAmountByToken(sellAmount, await this.getBondingCurveAccount(mint))
    const minSolOutputWithSlippage = PumpFun.calWithSlippageSell(BigInt(minSolOutput.toString()), slippageRate)
    const sellerPda = getAssociatedTokenAddressSync(mint, seller.publicKey)
    const sellAccounts = {
      global: PumpFun.global,
      feeRecipient: this.feeRecipient!,
      mint: mint,
      bondingCurve: PumpFun.getBondingCurve(mint),
      associatedBondingCurve: getAssociatedTokenAddressSync(mint, PumpFun.getBondingCurve(mint), true),
      associatedUser: sellerPda,
      user: seller.publicKey,
      systemProgram: new PublicKey('11111111111111111111111111111111'),
      tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
      eventAuthority: new PublicKey('Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1'),
      program: PROGRAM_ID,
    }
    const transaction = new Transaction().add(
      sell(
        {
          amount: new BN(sellTokenAmount.toString()),
          minSolOutput: new BN(minSolOutputWithSlippage.toString()),
        },
        sellAccounts
      )
    )

    const tx = await sendAndConfirmTransaction(this.conn, transaction, [seller], confirmOptions)
    console.log('Token sell', tx)
  }

  async getGlobalAccount() {
    return (await Global.fetch(this.conn, PumpFun.global, PROGRAM_ID))!
  }

  async getBondingCurveAccount(mint: PublicKey) {
    return (await BondingCurve.fetch(this.conn, PumpFun.getBondingCurve(mint), PROGRAM_ID))!
  }

  getInitTokenAmountBySol(solAmount: bigint, globalAccount: Global) {
    if (solAmount <= 0n) {
      return new BN(0)
    }
    solAmount = (solAmount * 9900n) / 10000n // 1% swap fee
    const n = globalAccount.initialVirtualSolReserves.mul(globalAccount.initialVirtualTokenReserves)
    const i = globalAccount.initialVirtualSolReserves.add(new BN(solAmount.toString()))
    const r = n.div(i).add(new BN(1))
    const s = globalAccount.initialVirtualTokenReserves.sub(r)
    return s < globalAccount.initialRealTokenReserves ? s : globalAccount.initialRealTokenReserves
  }

  getTokenAmountBySol(solAmount: bigint, bondingCurveAccount: BondingCurve) {
    if (bondingCurveAccount.complete) {
      throw new Error('Curve is complete')
    }
    if (solAmount <= 0n) {
      return new BN(0)
    }
    const n = bondingCurveAccount.virtualSolReserves.mul(bondingCurveAccount.virtualTokenReserves)
    const i = bondingCurveAccount.virtualSolReserves.add(new BN(solAmount.toString()))
    const r = n.div(i).add(new BN(1))
    const s = bondingCurveAccount.virtualTokenReserves.sub(r)
    return s < bondingCurveAccount.realTokenReserves ? s : bondingCurveAccount.realTokenReserves
  }

  getSolAmountByToken(tokenAmount: bigint, bondingCurveAccount: BondingCurve) {
    if (bondingCurveAccount.complete) {
      throw new Error('Curve is complete')
    }

    if (tokenAmount <= 0n) {
      return new BN(0)
    }
    const n = new BN(tokenAmount.toString())
      .mul(bondingCurveAccount.virtualSolReserves)
      .div(bondingCurveAccount.virtualTokenReserves.add(new BN(tokenAmount.toString())))
    const a = n.mul(new BN(100)).div(new BN(10000)) // 1% swap fee
    return n.sub(a)
  }
}

async function main() {
  // const token = PumpFun.generatePumpToken()
  // console.log(token.publicKey.toBase58(), Buffer.from(token.secretKey).toString('hex'), 'pump')

  // const token = Keypair.fromSecretKey(
  //   hexToUint8Array(
  //     'SecretKey hex string'
  //   )
  // )

  const token = Keypair.generate()
  const mint = token.publicKey
  // const mint = new PublicKey('6kjK6ZCkfRaVVVArZi4BtC5N97Gd5qx452DijVqtCdkM')
  const wallet = getWalletByIndex(0)
  const pumpFun = new PumpFun()
  await sleep(2000) // wait feeRecipient init

  // create pool and buy
  await pumpFun.createAndBuy(token, 'JiJiJi', 'JiJiJi', '', wallet, 1n * 10n ** 9n)

  // buy
  // await pumpFun.buy(mint, wallet, 1n * 10n ** 9n)

  // sell
  const tokenBalance = await getWalletTokenBalance(wallet, mint.toBase58(), pumpFun.conn.rpcEndpoint)
  console.log(tokenBalance)
  // await pumpFun.sell(mint, wallet, tokenBalance)
}

function hexToUint8Array(hexString: string): Uint8Array {
  return new Uint8Array(hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))
}

main()
  .then(() => console.log('end'))
  .catch((e) => console.error(e))
