export type CustomError =
  | NotAuthorized
  | AlreadyInitialized
  | TooMuchSolRequired
  | TooLittleSolReceived
  | MintDoesNotMatchBondingCurve
  | BondingCurveComplete
  | BondingCurveNotComplete
  | NotInitialized
  | WithdrawTooFrequent

export class NotAuthorized extends Error {
  static readonly code = 6000
  readonly code = 6000
  readonly name = "NotAuthorized"
  readonly msg =
    "The given account is not authorized to execute this instruction."

  constructor(readonly logs?: string[]) {
    super(
      "6000: The given account is not authorized to execute this instruction."
    )
  }
}

export class AlreadyInitialized extends Error {
  static readonly code = 6001
  readonly code = 6001
  readonly name = "AlreadyInitialized"
  readonly msg = "The program is already initialized."

  constructor(readonly logs?: string[]) {
    super("6001: The program is already initialized.")
  }
}

export class TooMuchSolRequired extends Error {
  static readonly code = 6002
  readonly code = 6002
  readonly name = "TooMuchSolRequired"
  readonly msg =
    "slippage: Too much SOL required to buy the given amount of tokens."

  constructor(readonly logs?: string[]) {
    super(
      "6002: slippage: Too much SOL required to buy the given amount of tokens."
    )
  }
}

export class TooLittleSolReceived extends Error {
  static readonly code = 6003
  readonly code = 6003
  readonly name = "TooLittleSolReceived"
  readonly msg =
    "slippage: Too little SOL received to sell the given amount of tokens."

  constructor(readonly logs?: string[]) {
    super(
      "6003: slippage: Too little SOL received to sell the given amount of tokens."
    )
  }
}

export class MintDoesNotMatchBondingCurve extends Error {
  static readonly code = 6004
  readonly code = 6004
  readonly name = "MintDoesNotMatchBondingCurve"
  readonly msg = "The mint does not match the bonding curve."

  constructor(readonly logs?: string[]) {
    super("6004: The mint does not match the bonding curve.")
  }
}

export class BondingCurveComplete extends Error {
  static readonly code = 6005
  readonly code = 6005
  readonly name = "BondingCurveComplete"
  readonly msg =
    "The bonding curve has completed and liquidity migrated to raydium."

  constructor(readonly logs?: string[]) {
    super(
      "6005: The bonding curve has completed and liquidity migrated to raydium."
    )
  }
}

export class BondingCurveNotComplete extends Error {
  static readonly code = 6006
  readonly code = 6006
  readonly name = "BondingCurveNotComplete"
  readonly msg = "The bonding curve has not completed."

  constructor(readonly logs?: string[]) {
    super("6006: The bonding curve has not completed.")
  }
}

export class NotInitialized extends Error {
  static readonly code = 6007
  readonly code = 6007
  readonly name = "NotInitialized"
  readonly msg = "The program is not initialized."

  constructor(readonly logs?: string[]) {
    super("6007: The program is not initialized.")
  }
}

export class WithdrawTooFrequent extends Error {
  static readonly code = 6008
  readonly code = 6008
  readonly name = "WithdrawTooFrequent"
  readonly msg = "Withdraw too frequent"

  constructor(readonly logs?: string[]) {
    super("6008: Withdraw too frequent")
  }
}

export function fromCode(code: number, logs?: string[]): CustomError | null {
  switch (code) {
    case 6000:
      return new NotAuthorized(logs)
    case 6001:
      return new AlreadyInitialized(logs)
    case 6002:
      return new TooMuchSolRequired(logs)
    case 6003:
      return new TooLittleSolReceived(logs)
    case 6004:
      return new MintDoesNotMatchBondingCurve(logs)
    case 6005:
      return new BondingCurveComplete(logs)
    case 6006:
      return new BondingCurveNotComplete(logs)
    case 6007:
      return new NotInitialized(logs)
    case 6008:
      return new WithdrawTooFrequent(logs)
  }

  return null
}
