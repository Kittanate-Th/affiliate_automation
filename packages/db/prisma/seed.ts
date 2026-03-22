import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Insert a test product
  const product = await prisma.product.upsert({
    where: { shopeeProductId: '123456789' },
    update: {},
    create: {
      shopeeProductId: '123456789',
      name: 'Test Product - Ergonomic Chair',
      price: 1599.00,
      commissionRate: 0.10,
      monthlySales: 500,
      productUrl: 'https://shopee.co.th/product/123/456',
      imageUrl: 'https://cf.shopee.co.th/file/test_image',
    },
  })
  
  console.log(`Created product with id: ${product.id}`)
  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
