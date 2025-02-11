import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface SellArgs {
  amount: BN
  minSolOutput: BN
}

export interface SellAccounts {
  global: PublicKey
  feeRecipient: PublicKey
  mint: PublicKey
  bondingCurve: PublicKey
  associatedBondingCurve: PublicKey
  associatedUser: PublicKey
  user: PublicKey
  systemProgram: PublicKey
  associatedTokenProgram: PublicKey
  tokenProgram: PublicKey
  eventAuthority: PublicKey
  program: PublicKey
}

export const layout = borsh.struct([
  borsh.u64("amount"),
  borsh.u64("minSolOutput"),
])

/** Sells tokens into a bonding curve. */
export function sell(
  args: SellArgs,
  accounts: SellAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.global, isSigner: false, isWritable: false },
    { pubkey: accounts.feeRecipient, isSigner: false, isWritable: true },
    { pubkey: accounts.mint, isSigner: false, isWritable: false },
    { pubkey: accounts.bondingCurve, isSigner: false, isWritable: true },
    {
      pubkey: accounts.associatedBondingCurve,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: accounts.associatedUser, isSigner: false, isWritable: true },
    { pubkey: accounts.user, isSigner: true, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.program, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([51, 230, 133, 164, 1, 127, 131, 173])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      amount: args.amount,
      minSolOutput: args.minSolOutput,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
