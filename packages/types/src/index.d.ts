export type EntityId = string | number

export interface UserSummary {
  id: EntityId
  email: string
  displayName: string
  isSuperAdmin: boolean
}

export { z } from 'zod'
