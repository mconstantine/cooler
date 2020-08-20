import { getDatabase } from '../misc/getDatabase'

export default async function init() {
  const db = await getDatabase()

  await db.exec(`
    CREATE TABLE IF NOT EXISTS session (
      id INTEGER PRIMARY KEY,
      start_time STRING NOT NULL DEFAULT CURRENT_TIMESTAMP,
      end_time STRING DEFAULT NULL,
      task INTEGER NOT NULL,
      FOREIGN KEY(task) REFERENCES task(id)
    );

    CREATE TRIGGER IF NOT EXISTS session_task_deleted AFTER DELETE ON task
    FOR EACH ROW BEGIN
      DELETE FROM session WHERE task = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS task_session_created AFTER INSERT ON session
    FOR EACH ROW BEGIN
      UPDATE task SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.task;
      UPDATE project SET updated_at = CURRENT_TIMESTAMP WHERE id = (
        SELECT project FROM task WHERE id = NEW.task
      );
    END;
  `)
}
