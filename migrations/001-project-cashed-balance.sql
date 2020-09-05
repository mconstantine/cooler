----------------------------------------------------------------------------------------------------------
-- Up
----------------------------------------------------------------------------------------------------------

ALTER TABLE project ADD COLUMN cashed_balance REAL DEFAULT NULL;

CREATE TRIGGER IF NOT EXISTS project_cashed_balance_consistency
AFTER UPDATE OF cashed_at ON project
FOR EACH ROW WHEN NEW.cashed_at IS NULL AND NEW.cashed_balance IS NOT NULL BEGIN
  UPDATE project SET cashed_balance = NULL WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS project_cashed_balance_default
AFTER UPDATE OF cashed_at, cashed_balance ON project
FOR EACH ROW WHEN NEW.cashed_at IS NOT NULL AND NEW.cashed_balance IS NULL BEGIN
  UPDATE project SET cashed_balance = (
    SELECT IFNULL(SUM((
      strftime('%s', session.end_time) - strftime('%s', session.start_time)
    ) / 3600.0 * task.hourlyCost), 0.0)
    FROM session
    JOIN task ON task.id = session.task
    WHERE task.project = OLD.id
  );
END;

----------------------------------------------------------------------------------------------------------
-- Down
----------------------------------------------------------------------------------------------------------
