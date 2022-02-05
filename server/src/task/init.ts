import { TaskEither } from 'fp-ts/TaskEither'
import SQL from 'sql-template-strings'
import { dbExec } from '../misc/dbUtils'
import { CoolerError } from '../misc/Types'

export default function init(): TaskEither<CoolerError, void> {
  return dbExec(SQL`
    CREATE TABLE IF NOT EXISTS task (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      start_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
