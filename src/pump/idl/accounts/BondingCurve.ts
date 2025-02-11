import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface BondingCurveFields {
  virtualTokenReserves: BN
  virtualSolReserves: BN
  realTokenReserves: BN
  realSolReserves: BN
  tokenTotalSupply: BN
  complete: boolean
}

export interface BondingCurveJSON {
  virtualTokenReserves: string
  virtualSolReserves: string
  realTokenReserves: string
  realSolReserves: string
  tokenTotalSupply: string
  complete: boolean
}

export class BondingCurve {
  readonly virtualTokenReserves: BN
  readonly virtualSolReserves: BN
  readonly realTokenReserves: BN
  readonly realSolReserves: BN
  readonly tokenTotalSupply: BN
  readonly complete: boolean

  static readonly discriminator = Buffer.from([
    23, 183, 248, 55, 96, 216, 172, 96,
  ])

  static readonly layout = borsh.struct([
    borsh.u64("virtualTokenReserves"),
    borsh.u64("virtualSolReserves"),
    borsh.u64("realTokenReserves"),
    borsh.u64("realSolReserves"),
    borsh.u64("tokenTotalSupply"),
    borsh.bool("complete"),
  ])

  constructor(fields: BondingCurveFields) {
    this.virtualTokenReserves = fields.virtualTokenReserves
    this.virtualSolReserves = fields.virtualSolReserves
    this.realTokenReserves = fields.realTokenReserves
    this.realSolReserves = fields.realSolReserves
    this.tokenTotalSupply = fields.tokenTotalSupply
    this.complete = fields.complete
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID
  ): Promise<BondingCurve | null> {
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
  ): Promise<Array<BondingCurve | null>> {
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

  static decode(data: Buffer): BondingCurve {
    if (!data.slice(0, 8).equals(BondingCurve.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = BondingCurve.layout.decode(data.slice(8))

    return new BondingCurve({
      virtualTokenReserves: dec.virtualTokenReserves,
      virtualSolReserves: dec.virtualSolReserves,
      realTokenReserves: dec.realTokenReserves,
      realSolReserves: dec.realSolReserves,
      tokenTotalSupply: dec.tokenTotalSupply,
      complete: dec.complete,
    })
  }

  toJSON(): BondingCurveJSON {
    return {
      virtualTokenReserves: this.virtualTokenReserves.toString(),
      virtualSolReserves: this.virtualSolReserves.toString(),
      realTokenReserves: this.realTokenReserves.toString(),
      realSolReserves: this.realSolReserves.toString(),
      tokenTotalSupply: this.tokenTotalSupply.toString(),
      complete: this.complete,
    }
  }

  static fromJSON(obj: BondingCurveJSON): BondingCurve {
    return new BondingCurve({
      virtualTokenReserves: new BN(obj.virtualTokenReserves),
      virtualSolReserves: new BN(obj.virtualSolReserves),
      realTokenReserves: new BN(obj.realTokenReserves),
      realSolReserves: new BN(obj.realSolReserves),
      tokenTotalSupply: new BN(obj.tokenTotalSupply),
      complete: obj.complete,
    })
  }
}
