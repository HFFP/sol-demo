import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface SetParamsArgs {
  feeRecipient: PublicKey
  initialVirtualTokenReserves: BN
  initialVirtualSolReserves: BN
  initialRealTokenReserves: BN
  tokenTotalSupply: BN
  feeBasisPoints: BN
}

export interface SetParamsAccounts {
  global: PublicKey
  user: PublicKey
  systemProgram: PublicKey
  eventAuthority: PublicKey
  program: PublicKey
}

export const layout = borsh.struct([
  borsh.publicKey("feeRecipient"),
  borsh.u64("initialVirtualTokenReserves"),
  borsh.u64("initialVirtualSolReserves"),
  borsh.u64("initialRealTokenReserves"),
  borsh.u64("tokenTotalSupply"),
  borsh.u64("feeBasisPoints"),
])

/** Sets the global state parameters. */
export function setParams(
  args: SetParamsArgs,
  accounts: SetParamsAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.global, isSigner: false, isWritable: true },
    { pubkey: accounts.user, isSigner: true, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.program, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([27, 234, 178, 52, 147, 2, 187, 141])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      feeRecipient: args.feeRecipient,
      initialVirtualTokenReserves: args.initialVirtualTokenReserves,
      initialVirtualSolReserves: args.initialVirtualSolReserves,
      initialRealTokenReserves: args.initialRealTokenReserves,
      tokenTotalSupply: args.tokenTotalSupply,
      feeBasisPoints: args.feeBasisPoints,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
