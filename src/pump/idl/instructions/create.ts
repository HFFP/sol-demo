import { TransactionInstruction, PublicKey, AccountMeta } from '@solana/web3.js' // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from 'bn.js' // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from '@coral-xyz/borsh' // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from '../programId'

export interface CreateArgs {
  name: string
  symbol: string
  uri: string
}

export interface CreateAccounts {
  mint: PublicKey
  mintAuthority: PublicKey
  bondingCurve: PublicKey
  associatedBondingCurve: PublicKey
  global: PublicKey
  mplTokenMetadata: PublicKey
  metadata: PublicKey
  user: PublicKey
  systemProgram: PublicKey
  tokenProgram: PublicKey
  associatedTokenProgram: PublicKey
  rent: PublicKey
  eventAuthority: PublicKey
  program: PublicKey
}

export const layout = borsh.struct([borsh.str('name'), borsh.str('symbol'), borsh.str('uri')])

/** Creates a new coin and bonding curve. */
export function create(args: CreateArgs, accounts: CreateAccounts, programId: PublicKey = PROGRAM_ID) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.mint, isSigner: true, isWritable: true },
    { pubkey: accounts.mintAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.bondingCurve, isSigner: false, isWritable: true },
    {
      pubkey: accounts.associatedBondingCurve,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: accounts.global, isSigner: false, isWritable: false },
    { pubkey: accounts.mplTokenMetadata, isSigner: false, isWritable: false },
    { pubkey: accounts.metadata, isSigner: false, isWritable: true },
    { pubkey: accounts.user, isSigner: true, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.rent, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.program, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([24, 30, 200, 40, 5, 28, 7, 119])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      name: args.name,
      symbol: args.symbol,
      uri: args.uri,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
