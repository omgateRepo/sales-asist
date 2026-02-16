import 'dotenv/config'
import bcrypt from 'bcryptjs'
import prisma from '../src/prisma.js'

const DEFAULT_ADMIN_EMAIL = 'admin'
const DEFAULT_ADMIN_PASSWORD = 'Password1'
const DEFAULT_ADMIN_DISPLAY_NAME = 'Admin'

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.log('Seed: DATABASE_URL not set, skipping')
    process.exit(0)
  }
  try {
    const passwordHash = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10)
    await prisma.users.upsert({
      where: { email: DEFAULT_ADMIN_EMAIL },
      create: {
        email: DEFAULT_ADMIN_EMAIL,
        display_name: DEFAULT_ADMIN_DISPLAY_NAME,
        password_hash: passwordHash,
        is_super_admin: true,
      },
      update: {},
    })
    console.log('Seed: default admin user (admin / Password1) ensured')
  } catch (err) {
    console.error('Seed failed:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seed()
