import { getDatabase } from '../misc/getDatabase'

export default async function init() {
  const db = await getDatabase()

  await db.exec(`
    CREATE TABLE IF NOT EXISTS project (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER IF NOT EXISTS project_updated_at AFTER UPDATE ON project
    FOR EACH ROW BEGIN
      UPDATE project SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

    CREATE TABLE IF NOT EXISTS project_client (
      project INTEGER NOT NULL,
      client INTEGER NOT NULL,
      PRIMARY KEY (project, client),
      FOREIGN KEY(project) REFERENCES project(id),
      FOREIGN KEY(client) REFERENCES client(id)
    )
  `)
}
