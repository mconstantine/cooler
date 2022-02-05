import SQL from 'sql-template-strings'
import { TaskEither } from 'fp-ts/TaskEither'
import { dbExec } from '../misc/dbUtils'
import { CoolerError } from '../misc/Types'

export default function init(): TaskEither<CoolerError, void> {
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
      DELETE FROM tax WHERE tax.user = OLD.id;
    END;
  `)
}
