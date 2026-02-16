import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from './prisma.js'
import { requirePlatformAdmin } from './middleware/auth.js'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ ok: true })
})

// Signup: create tenant (pending) + company admin user. No auth required.
router.post('/signup', async (req, res, next) => {
  try {
    const { companyName, email, password, displayName } = req.body || {}
    if (!companyName || !email || !password) {
      return res.status(400).json({ error: 'companyName, email, and password are required' })
    }
    const normalizedEmail = String(email).toLowerCase().trim()
    const existing = await prisma.users.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }
    const passwordHash = bcrypt.hashSync(String(password), 10)
    const tenant = await prisma.tenants.create({
      data: { name: String(companyName).trim(), status: 'pending' },
    })
    await prisma.users.create({
      data: {
        email: normalizedEmail,
        display_name: (displayName || email).trim().slice(0, 255),
        password_hash: passwordHash,
        role: 'company_admin',
        tenant_id: tenant.id,
      },
    })
    return res.status(201).json({
      tenantId: tenant.id,
      message: 'Company created. Pending platform approval.',
    })
  } catch (err) {
    next(err)
  }
})

// Platform admin: list tenants
router.get('/platform/tenants', requirePlatformAdmin, async (_req, res, next) => {
  try {
    const tenants = await prisma.tenants.findMany({
      orderBy: { created_at: 'desc' },
      select: { id: true, name: true, status: true, created_at: true },
    })
    res.json(tenants)
  } catch (err) {
    next(err)
  }
})

// Platform admin: approve (or update) tenant
router.patch('/platform/tenants/:id', requirePlatformAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body || {}
    if (!status || !['pending', 'active'].includes(status)) {
      return res.status(400).json({ error: 'body.status must be "pending" or "active"' })
    }
    const tenant = await prisma.tenants.update({
      where: { id },
      data: { status },
    })
    res.json(tenant)
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Tenant not found' })
    }
    next(err)
  }
})

router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  res.json({
    id: req.user.id,
    email: req.user.email,
    displayName: req.user.displayName,
    isSuperAdmin: req.user.isSuperAdmin,
    role: req.user.role,
    tenantId: req.user.tenantId,
    tenantStatus: req.user.tenantStatus,
  })
})

export default router
