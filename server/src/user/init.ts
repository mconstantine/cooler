import { ApolloError } from 'apollo-server-express'
import { TaskEither } from 'fp-ts/TaskEither'
import SQL from 'sql-template-strings'
import { dbExec } from '../misc/dbUtils'

export default function init(): TaskEither<ApolloError, void> {
  return dbExec(SQL`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER NOT NULL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER IF NOT EXISTS user_updated_at AFTER UPDATE ON user
    FOR EACH ROW BEGIN
      UPDATE user SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `)
}
