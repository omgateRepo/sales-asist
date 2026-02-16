import { Router } from 'express'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ ok: true })
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
  })
})

export default router
