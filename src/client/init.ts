import { getDatabase } from '../misc/getDatabase'

export default async function init() {
  const db = await getDatabase()

  await db.exec(`
    CREATE TABLE IF NOT EXISTS client (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER IF NOT EXISTS client_updated_at AFTER UPDATE ON client
    FOR EACH ROW BEGIN
      UPDATE client SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `)
}
