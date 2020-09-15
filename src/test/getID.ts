import { insert } from '../misc/dbUtils'
import { definitely } from '../misc/definitely'

export async function getID<T>(
  tableName: string,
  rows: T | T[]
): Promise<number> {
  const statement = await insert<T>(tableName, rows)
  return definitely(statement.lastID)
}
