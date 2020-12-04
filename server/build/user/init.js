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
    return dbUtils_1.dbExec(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    CREATE TABLE IF NOT EXISTS user (\n      id INTEGER NOT NULL PRIMARY KEY,\n      name TEXT NOT NULL,\n      email TEXT NOT NULL,\n      password TEXT NOT NULL,\n      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP\n    );\n\n    CREATE TRIGGER IF NOT EXISTS user_updated_at AFTER UPDATE ON user\n    FOR EACH ROW BEGIN\n      UPDATE user SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;\n    END;\n  "], ["\n    CREATE TABLE IF NOT EXISTS user (\n      id INTEGER NOT NULL PRIMARY KEY,\n      name TEXT NOT NULL,\n      email TEXT NOT NULL,\n      password TEXT NOT NULL,\n      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP\n    );\n\n    CREATE TRIGGER IF NOT EXISTS user_updated_at AFTER UPDATE ON user\n    FOR EACH ROW BEGIN\n      UPDATE user SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;\n    END;\n  "]))));
}
exports.default = init;
var templateObject_1;
