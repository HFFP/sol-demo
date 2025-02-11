import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface WithdrawAccounts {
  global: PublicKey
  lastWithdraw: PublicKey
  mint: PublicKey
  bondingCurve: PublicKey
  associatedBondingCurve: PublicKey
  associatedUser: PublicKey
  user: PublicKey
  systemProgram: PublicKey
  tokenProgram: PublicKey
  rent: PublicKey
  eventAuthority: PublicKey
  program: PublicKey
}

/** Allows the admin to withdraw liquidity for a migration once the bonding curve completes */
export function withdraw(
  accounts: WithdrawAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.global, isSigner: false, isWritable: false },
    { pubkey: accounts.lastWithdraw, isSigner: false, isWritable: true },
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
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.rent, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.program, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([183, 18, 70, 156, 148, 109, 161, 34])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
