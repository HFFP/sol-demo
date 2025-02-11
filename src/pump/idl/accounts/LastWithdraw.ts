import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface LastWithdrawFields {
  lastWithdrawTimestamp: BN
}

export interface LastWithdrawJSON {
  lastWithdrawTimestamp: string
}

export class LastWithdraw {
  readonly lastWithdrawTimestamp: BN

  static readonly discriminator = Buffer.from([
    203, 18, 220, 103, 120, 145, 187, 2,
  ])

  static readonly layout = borsh.struct([borsh.i64("lastWithdrawTimestamp")])

  constructor(fields: LastWithdrawFields) {
    this.lastWithdrawTimestamp = fields.lastWithdrawTimestamp
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID
  ): Promise<LastWithdraw | null> {
    const info = await c.getAccountInfo(address)

    if (info === null) {
      return null
    }
    if (!info.owner.equals(programId)) {
      throw new Error("account doesn't belong to this program")
    }

    return this.decode(info.data)
  }

  static async fetchMultiple(
    c: Connection,
    addresses: PublicKey[],
    programId: PublicKey = PROGRAM_ID
  ): Promise<Array<LastWithdraw | null>> {
    const infos = await c.getMultipleAccountsInfo(addresses)

    return infos.map((info) => {
      if (info === null) {
        return null
      }
      if (!info.owner.equals(programId)) {
        throw new Error("account doesn't belong to this program")
      }

      return this.decode(info.data)
    })
  }

  static decode(data: Buffer): LastWithdraw {
    if (!data.slice(0, 8).equals(LastWithdraw.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = LastWithdraw.layout.decode(data.slice(8))

    return new LastWithdraw({
      lastWithdrawTimestamp: dec.lastWithdrawTimestamp,
    })
  }

  toJSON(): LastWithdrawJSON {
    return {
      lastWithdrawTimestamp: this.lastWithdrawTimestamp.toString(),
    }
  }

  static fromJSON(obj: LastWithdrawJSON): LastWithdraw {
    return new LastWithdraw({
      lastWithdrawTimestamp: new BN(obj.lastWithdrawTimestamp),
    })
  }
}
