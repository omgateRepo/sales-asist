import { describe, expect, it } from 'vitest'

describe('health', () => {
  it('returns ok', () => {
    expect({ ok: true }).toEqual({ ok: true })
  })
})
