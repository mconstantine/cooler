"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectById = exports.deleteProject = exports.updateProject = exports.insertProject = void 0;
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var dbUtils_1 = require("../misc/dbUtils");
var interface_1 = require("./interface");
function insertProject(project) {
    return dbUtils_1.insert('project', project, interface_1.ProjectCreationInput);
}
exports.insertProject = insertProject;
function updateProject(id, project) {
    return dbUtils_1.update('project', id, project, interface_1.ProjectUpdateInput);
}
exports.updateProject = updateProject;
function deleteProject(id) {
    return dbUtils_1.remove('project', { id: id });
}
exports.deleteProject = deleteProject;
function getProjectById(id) {
    return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      SELECT project.*, client.user\n      FROM project\n      JOIN client ON client.id = project.client\n      WHERE project.id = ", "\n    "], ["\n      SELECT project.*, client.user\n      FROM project\n      JOIN client ON client.id = project.client\n      WHERE project.id = ", "\n    "])), id), interface_1.DatabaseProject);
}
exports.getProjectById = getProjectById;
var templateObject_1;
