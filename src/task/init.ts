import { getDatabase } from '../misc/getDatabase'

export default async function init() {
  const db = await getDatabase()

  await db.exec(`
    CREATE TABLE IF NOT EXISTS task (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      expectedWorkingHours INTEGER NOT NULL,
      hourlyCost REAL NOT NULL,
      project INTEGER NOT NULL,
      created_at STRING NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at STRING NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project) REFERENCES project(id)
    );

    CREATE TRIGGER IF NOT EXISTS task_updated_at AFTER UPDATE ON task
    FOR EACH ROW BEGIN
      UPDATE task SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS task_project_deleted AFTER DELETE ON project
    FOR EACH ROW BEGIN
      DELETE FROM task WHERE project = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS project_task_created AFTER INSERT ON task
    FOR EACH ROW BEGIN
      UPDATE project SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.project;
    END;
  `)
}
