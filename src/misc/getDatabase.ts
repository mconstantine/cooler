import { cached } from 'sqlite3'
import { open, Database } from 'sqlite'
import path from 'path'

let database: Database

export async function getDatabase(): Promise<Database> {
  if (!database) {
    database = await open({
      filename:
        process.env.NODE_ENV === 'test'
          ? ':memory:'
          : path.join(process.cwd(), 'data.db'),
      driver: cached.Database
    })
  }

  return database
}
