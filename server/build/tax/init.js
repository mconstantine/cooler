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
    return dbUtils_1.dbExec(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    CREATE TABLE IF NOT EXISTS tax (\n      id INTEGER PRIMARY KEY,\n      label TEXT NOT NULL,\n      value FLOAT NOT NULL,\n      user INTEGER NOT NULL,\n      FOREIGN KEY(user) REFERENCES user(id)\n    );\n\n    CREATE TRIGGER IF NOT EXISTS tax_user_deleted AFTER DELETE ON user\n    FOR EACH ROW BEGIN\n      DELETE FROM tax WHERE tax.user = OLD.id;\n    END;\n  "], ["\n    CREATE TABLE IF NOT EXISTS tax (\n      id INTEGER PRIMARY KEY,\n      label TEXT NOT NULL,\n      value FLOAT NOT NULL,\n      user INTEGER NOT NULL,\n      FOREIGN KEY(user) REFERENCES user(id)\n    );\n\n    CREATE TRIGGER IF NOT EXISTS tax_user_deleted AFTER DELETE ON user\n    FOR EACH ROW BEGIN\n      DELETE FROM tax WHERE tax.user = OLD.id;\n    END;\n  "]))));
}
exports.default = init;
var templateObject_1;
