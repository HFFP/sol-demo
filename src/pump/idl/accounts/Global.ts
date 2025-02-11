import { PublicKey, Connection } from '@solana/web3.js'
import BN from 'bn.js' // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from '@coral-xyz/borsh' // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from '../programId'

export interface GlobalFields {
  initialized: boolean
  authority: PublicKey
  feeRecipient: PublicKey
  initialVirtualTokenReserves: BN
  initialVirtualSolReserves: BN
  initialRealTokenReserves: BN
  tokenTotalSupply: BN
  feeBasisPoints: BN
}

export interface GlobalJSON {
  initialized: boolean
  authority: string
  feeRecipient: string
  initialVirtualTokenReserves: string
  initialVirtualSolReserves: string
  initialRealTokenReserves: string
  tokenTotalSupply: string
  feeBasisPoints: string
}

export class Global {
  readonly initialized: boolean
  readonly authority: PublicKey
  readonly feeRecipient: PublicKey
  readonly initialVirtualTokenReserves: BN
  readonly initialVirtualSolReserves: BN
  readonly initialRealTokenReserves: BN
  readonly tokenTotalSupply: BN
  readonly feeBasisPoints: BN

  static readonly discriminator = Buffer.from([167, 232, 232, 177, 200, 108, 114, 127])

  static readonly layout = borsh.struct([
    borsh.bool('initialized'),
    borsh.publicKey('authority'),
    borsh.publicKey('feeRecipient'),
    borsh.u64('initialVirtualTokenReserves'),
    borsh.u64('initialVirtualSolReserves'),
    borsh.u64('initialRealTokenReserves'),
    borsh.u64('tokenTotalSupply'),
    borsh.u64('feeBasisPoints'),
  ])

  constructor(fields: GlobalFields) {
    this.initialized = fields.initialized
    this.authority = fields.authority
    this.feeRecipient = fields.feeRecipient
    this.initialVirtualTokenReserves = fields.initialVirtualTokenReserves
    this.initialVirtualSolReserves = fields.initialVirtualSolReserves
    this.initialRealTokenReserves = fields.initialRealTokenReserves
    this.tokenTotalSupply = fields.tokenTotalSupply
    this.feeBasisPoints = fields.feeBasisPoints
  }

  static async fetch(c: Connection, address: PublicKey, programId: PublicKey = PROGRAM_ID): Promise<Global | null> {
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
  ): Promise<Array<Global | null>> {
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

  static decode(data: Buffer): Global {
    if (!data.slice(0, 8).equals(Global.discriminator)) {
      throw new Error('invalid account discriminator')
    }

    const dec = Global.layout.decode(data.slice(8))

    return new Global({
      initialized: dec.initialized,
      authority: dec.authority,
      feeRecipient: dec.feeRecipient,
      initialVirtualTokenReserves: dec.initialVirtualTokenReserves,
      initialVirtualSolReserves: dec.initialVirtualSolReserves,
      initialRealTokenReserves: dec.initialRealTokenReserves,
      tokenTotalSupply: dec.tokenTotalSupply,
      feeBasisPoints: dec.feeBasisPoints,
    })
  }

  toJSON(): GlobalJSON {
    return {
      initialized: this.initialized,
      authority: this.authority.toString(),
      feeRecipient: this.feeRecipient.toString(),
      initialVirtualTokenReserves: this.initialVirtualTokenReserves.toString(),
      initialVirtualSolReserves: this.initialVirtualSolReserves.toString(),
      initialRealTokenReserves: this.initialRealTokenReserves.toString(),
      tokenTotalSupply: this.tokenTotalSupply.toString(),
      feeBasisPoints: this.feeBasisPoints.toString(),
    }
  }

  static fromJSON(obj: GlobalJSON): Global {
    return new Global({
      initialized: obj.initialized,
      authority: new PublicKey(obj.authority),
      feeRecipient: new PublicKey(obj.feeRecipient),
      initialVirtualTokenReserves: new BN(obj.initialVirtualTokenReserves),
      initialVirtualSolReserves: new BN(obj.initialVirtualSolReserves),
      initialRealTokenReserves: new BN(obj.initialRealTokenReserves),
      tokenTotalSupply: new BN(obj.tokenTotalSupply),
      feeBasisPoints: new BN(obj.feeBasisPoints),
    })
  }
}
