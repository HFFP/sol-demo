export const grpcUrl = 'https://solana-devnet.g.alchemy.com/v2/D_DnjwwM5TLMrC4oVZNyxvg-YbVW2Xp4'

Object.defineProperty(BigInt.prototype, 'toJSON', {
  value: function() {
    return this.toString() + 'n' // 将 BigInt 转为带 'n' 后缀的字符串
  },
  writable: true,
  configurable: true
})
