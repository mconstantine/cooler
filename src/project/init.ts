import { getDatabase } from '../misc/getDatabase'

export default async function init() {
  const db = await getDatabase()

  await db.exec(`
    CREATE TABLE IF NOT EXISTS project (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      client INTEGER NOT NULL,
      cached_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(client) REFERENCES client(id)
    );

    CREATE TRIGGER IF NOT EXISTS project_updated_at AFTER UPDATE ON project
    FOR EACH ROW BEGIN
      UPDATE project SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS project_client_deleted AFTER DELETE ON client
    FOR EACH ROW BEGIN
      DELETE FROM project WHERE client = OLD.id;
    END;
  `)
}
