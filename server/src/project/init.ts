import { TaskEither } from 'fp-ts/TaskEither'
import SQL from 'sql-template-strings'
import { dbExec } from '../misc/dbUtils'
import { CoolerError } from '../misc/Types'

export default function init(): TaskEither<CoolerError, void> {
  return dbExec(SQL`
    CREATE TABLE IF NOT EXISTS project (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      client INTEGER NOT NULL,
      cashed_at TEXT DEFAULT NULL,
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
