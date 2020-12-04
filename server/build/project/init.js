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
    return dbUtils_1.dbExec(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    CREATE TABLE IF NOT EXISTS project (\n      id INTEGER PRIMARY KEY,\n      name TEXT NOT NULL,\n      description TEXT,\n      client INTEGER NOT NULL,\n      cashed_at TEXT DEFAULT NULL,\n      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n      FOREIGN KEY(client) REFERENCES client(id)\n    );\n\n    CREATE TRIGGER IF NOT EXISTS project_updated_at AFTER UPDATE ON project\n    FOR EACH ROW BEGIN\n      UPDATE project SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;\n    END;\n\n    CREATE TRIGGER IF NOT EXISTS project_client_deleted AFTER DELETE ON client\n    FOR EACH ROW BEGIN\n      DELETE FROM project WHERE client = OLD.id;\n    END;\n  "], ["\n    CREATE TABLE IF NOT EXISTS project (\n      id INTEGER PRIMARY KEY,\n      name TEXT NOT NULL,\n      description TEXT,\n      client INTEGER NOT NULL,\n      cashed_at TEXT DEFAULT NULL,\n      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n      FOREIGN KEY(client) REFERENCES client(id)\n    );\n\n    CREATE TRIGGER IF NOT EXISTS project_updated_at AFTER UPDATE ON project\n    FOR EACH ROW BEGIN\n      UPDATE project SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;\n    END;\n\n    CREATE TRIGGER IF NOT EXISTS project_client_deleted AFTER DELETE ON client\n    FOR EACH ROW BEGIN\n      DELETE FROM project WHERE client = OLD.id;\n    END;\n  "]))));
}
exports.default = init;
var templateObject_1;
