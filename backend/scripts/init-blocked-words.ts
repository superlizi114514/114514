import prisma from '../src/db.js'

const defaultBlockedWords = [
  '傻逼',
  '二逼',
  '脑瘫',
  '傻子',
  '逼',
  '操',
  '他妈',
  ' fuck ',
  'shit',
  'SB',
  'sb',
  '尼玛',
  '草泥马',
  '麻痹',
  '妈逼',
  '杂种',
  '畜生',
  '狗东西',
  '贱人',
  '去死'
]

async function init() {
  try {
    let count = 0
    for (const word of defaultBlockedWords) {
      try {
        await prisma.blockedWord.create({
          data: {
            word: word.trim(),
            category: 'insult',
            isActive: true
          }
        })
        count++
      } catch (e) {
        // 已存在，跳过
      }
    }
    console.log(`初始化完成，共添加 ${count} 个违禁词`)
    await prisma.$disconnect()
  } catch (e) {
    console.error('初始化失败:', e)
    await prisma.$disconnect()
    process.exit(1)
  }
}

init()
