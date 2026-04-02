import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types'

export const useRole = () => {
  const role = useAuthStore((s) => s.user?.role)

  const is = (...roles: Role[]) => !!role && roles.includes(role)

  return {
    role,
    isAdmin: role === 'ADMIN',
    isStaff: role === 'STAFF',
    isMarketing: role === 'MARKETING',
    /** Returns true if the current user has at least one of the given roles */
    can: (...roles: Role[]) => is(...roles),
  }
}
