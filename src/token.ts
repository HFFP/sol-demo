import {
  clusterApiUrl,
  ConfirmOptions,
  Connection,
  Keypair, PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction
} from '@solana/web3.js'
import { getWalletByIndex } from './wallets'
import {
  TOKEN_PROGRAM_ID,
  createMintToInstruction,
  createInitializeMint2Instruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  createAssociatedTokenAccountInstruction,
  createSetAuthorityInstruction,
  getAssociatedTokenAddressSync,
  AuthorityType
} from '@solana/spl-token'
import {
  createCreateMetadataAccountV3Instruction, PROGRAM_ID as METADATA_PROGRAM_ID
} from '@metaplex-foundation/mpl-token-metadata'

/*
  * Create a new token
  * and mint  all tokens to the creater
 */
async function createToken(name: string, symbol: string, creater: Keypair, confirmOptions?: ConfirmOptions) {
  const connection = new Connection(clusterApiUrl('devnet'))
  // Create a new token
  const decimals = 9n
  const amount = 1000000000n * 10n ** decimals
  const lamports = await getMinimumBalanceForRentExemptMint(connection)
  const token = Keypair.generate()
  const mintAuthority = creater.publicKey
  const freezeAuthority = null
  const programId = TOKEN_PROGRAM_ID

  const pdaAccount = getAssociatedTokenAddressSync(token.publicKey, creater.publicKey)

  const metadataAccount = PublicKey.findProgramAddressSync([Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), token.publicKey.toBuffer()], METADATA_PROGRAM_ID)[0]

  const metadataData = {
    name: name,
    symbol: symbol,
    uri: 'https://example.com/nft.json', // 指向元数据的链接
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null
  }

  const transaction = new Transaction().add(
    // new token account
    SystemProgram.createAccount({
      fromPubkey: creater.publicKey,
      newAccountPubkey: token.publicKey,
      space: MINT_SIZE,
      lamports,
      programId
    }),
    // init token
    createInitializeMint2Instruction(token.publicKey, Number(decimals), mintAuthority, freezeAuthority, programId),
    // create creater pda account
    createAssociatedTokenAccountInstruction(creater.publicKey, pdaAccount, creater.publicKey, token.publicKey),
    // mini token to creater pda
    createMintToInstruction(token.publicKey, pdaAccount, creater.publicKey, amount),
    // 创建metadata
    createCreateMetadataAccountV3Instruction({
      metadata: metadataAccount,
      mint: token.publicKey,
      mintAuthority: creater.publicKey,
      updateAuthority: creater.publicKey,
      payer: creater.publicKey
    }, { createMetadataAccountArgsV3: { data: metadataData, isMutable: false, collectionDetails: null } }),
    // drop mintAuthority
    createSetAuthorityInstruction(
      token.publicKey,          // mint 地址
      creater.publicKey,        // 当前 mintAuthority
      AuthorityType.MintTokens, // 权限类型是 MintTokens
      null,                     // 新的 mintAuthority 设置为 null（丢弃权限）
      []                        // 不需要签名密钥，只有 currentAuthority 需要
    )
  )

  const tx = await sendAndConfirmTransaction(connection, transaction, [creater, token], confirmOptions)

  console.log('Token created:', token.publicKey.toBase58(), tx)
}

async function main() {
  const wallet = getWalletByIndex(0)
  const token = await createToken('Lonzo', 'Lonzo', wallet)
}

main()
  .then(() => console.log('end'))
  .catch((err) => console.error(err))
