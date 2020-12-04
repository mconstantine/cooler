"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionById = exports.deleteSession = exports.updateSession = exports.insertSession = void 0;
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var dbUtils_1 = require("../misc/dbUtils");
var interface_1 = require("./interface");
function insertSession(session) {
    return dbUtils_1.insert('session', session, interface_1.SessionCreationInput);
}
exports.insertSession = insertSession;
function updateSession(id, session) {
    return dbUtils_1.update('session', id, session, interface_1.SessionUpdateInput);
}
exports.updateSession = updateSession;
function deleteSession(id) {
    return dbUtils_1.remove('session', { id: id });
}
exports.deleteSession = deleteSession;
function getSessionById(id) {
    return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      SELECT session.*, client.user\n      FROM session\n      JOIN task ON session.task = task.id\n      JOIN project ON task.project = project.id\n      JOIN client ON client.id = project.client\n      WHERE session.id = ", "\n    "], ["\n      SELECT session.*, client.user\n      FROM session\n      JOIN task ON session.task = task.id\n      JOIN project ON task.project = project.id\n      JOIN client ON client.id = project.client\n      WHERE session.id = ", "\n    "])), id), interface_1.DatabaseSession);
}
exports.getSessionById = getSessionById;
var templateObject_1;
