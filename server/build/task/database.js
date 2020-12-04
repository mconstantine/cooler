"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskById = exports.deleteTask = exports.updateTask = exports.insertTask = void 0;
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var dbUtils_1 = require("../misc/dbUtils");
var interface_1 = require("./interface");
function insertTask(task) {
    return dbUtils_1.insert('task', task, interface_1.TaskCreationInput);
}
exports.insertTask = insertTask;
function updateTask(id, task) {
    return dbUtils_1.update('task', id, task, interface_1.TaskUpdateInput);
}
exports.updateTask = updateTask;
function deleteTask(id) {
    return dbUtils_1.remove('task', { id: id });
}
exports.deleteTask = deleteTask;
function getTaskById(id) {
    return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      SELECT task.*, client.user\n      FROM task\n      JOIN project ON project.id = task.project\n      JOIN client ON client.id = project.client\n      WHERE task.id = ", "\n    "], ["\n      SELECT task.*, client.user\n      FROM task\n      JOIN project ON project.id = task.project\n      JOIN client ON client.id = project.client\n      WHERE task.id = ", "\n    "])), id), interface_1.DatabaseTask);
}
exports.getTaskById = getTaskById;
var templateObject_1;
