import { defineRelations } from 'drizzle-orm'
import * as schema from './schema'

export default defineRelations(schema, r => ({
  user: {
    emails: r.many.userEmail({
      from: r.user.id,
      to: r.userEmail.userId,
    }),
  },
}))
