import { ApolloError } from 'apollo-server-express'
import { TaskEither } from 'fp-ts/TaskEither'
import SQL from 'sql-template-strings'
import { dbExec } from '../misc/dbUtils'

export default function init(): TaskEither<ApolloError, void> {
  return dbExec(SQL`
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
