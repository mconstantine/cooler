import SQL from 'sql-template-strings'
import { TaskEither } from 'fp-ts/TaskEither'
import { ApolloError } from 'apollo-server-express'
import { dbExec } from '../misc/dbUtils'

export default function init(): TaskEither<ApolloError, void> {
  return dbExec(SQL`
    CREATE TABLE IF NOT EXISTS tax (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL,
      value FLOAT NOT NULL,
      user INTEGER NOT NULL,
      FOREIGN KEY(user) REFERENCES user(id)
    );

    CREATE TRIGGER IF NOT EXISTS tax_user_deleted AFTER DELETE ON user
    FOR EACH ROW BEGIN
      DELETE FROM tax WHERE tax.id = OLD.id;
    END;
  `)
}
