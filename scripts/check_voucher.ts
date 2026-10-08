import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const vs = await db.voucher.findMany()
  for (const v of vs) {
    console.log({
      code: v.code, type: v.type, value: v.value, minPurchase: v.minPurchase,
      maxDiscount: v.maxDiscount, isActive: v.isActive,
      startsAt: v.startsAt, expiresAt: v.expiresAt,
      usageLimit: v.usageLimit, usedCount: v.usedCount,
    })
  }
  console.log('NOW =', new Date().toISOString())
}
main().finally(() => db.$disconnect())
