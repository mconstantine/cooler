import { getDatabase } from '../misc/getDatabase'

export default async function init() {
  const db = await getDatabase()

  await db.exec(`
    CREATE TABLE IF NOT EXISTS task (
      id INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      expectedWorkingHours NUMBER NOT NULL,
      actualWorkingHours NUMBER NOT NULL,
      created_at STRING NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at STRING NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER IF NOT EXISTS task_updated_at AFTER UPDATE ON task
    FOR EACH ROW BEGIN
      UPDATE task SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

    CREATE TABLE IF NOT EXISTS task_project (
      task INTEGER NOT NULL,
      project INTEGER NOT NULL,
      PRIMARY KEY (task, project),
      FOREIGN KEY(task) REFERENCES task(id),
      FOREIGN KEY(project) REFERENCES project(id)
    )
  `)
}
