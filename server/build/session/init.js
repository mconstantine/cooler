"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var dbUtils_1 = require("../misc/dbUtils");
function init() {
    return dbUtils_1.dbExec(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    CREATE TABLE IF NOT EXISTS session (\n      id INTEGER PRIMARY KEY,\n      start_time STRING NOT NULL DEFAULT CURRENT_TIMESTAMP,\n      end_time STRING DEFAULT NULL,\n      task INTEGER NOT NULL,\n      FOREIGN KEY(task) REFERENCES task(id)\n    );\n\n    CREATE TRIGGER IF NOT EXISTS session_task_deleted AFTER DELETE ON task\n    FOR EACH ROW BEGIN\n      DELETE FROM session WHERE task = OLD.id;\n    END;\n\n    CREATE TRIGGER IF NOT EXISTS task_session_created AFTER INSERT ON session\n    FOR EACH ROW BEGIN\n      UPDATE task SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.task;\n      UPDATE project SET updated_at = CURRENT_TIMESTAMP WHERE id = (\n        SELECT project FROM task WHERE id = NEW.task\n      );\n    END;\n  "], ["\n    CREATE TABLE IF NOT EXISTS session (\n      id INTEGER PRIMARY KEY,\n      start_time STRING NOT NULL DEFAULT CURRENT_TIMESTAMP,\n      end_time STRING DEFAULT NULL,\n      task INTEGER NOT NULL,\n      FOREIGN KEY(task) REFERENCES task(id)\n    );\n\n    CREATE TRIGGER IF NOT EXISTS session_task_deleted AFTER DELETE ON task\n    FOR EACH ROW BEGIN\n      DELETE FROM session WHERE task = OLD.id;\n    END;\n\n    CREATE TRIGGER IF NOT EXISTS task_session_created AFTER INSERT ON session\n    FOR EACH ROW BEGIN\n      UPDATE task SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.task;\n      UPDATE project SET updated_at = CURRENT_TIMESTAMP WHERE id = (\n        SELECT project FROM task WHERE id = NEW.task\n      );\n    END;\n  "]))));
}
exports.default = init;
var templateObject_1;
