"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientById = exports.deleteClient = exports.updateClient = exports.insertClient = void 0;
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var dbUtils_1 = require("../misc/dbUtils");
var interface_1 = require("./interface");
function insertClient(client) {
    return dbUtils_1.insert('client', client, interface_1.ClientCreationInput);
}
exports.insertClient = insertClient;
function updateClient(id, client) {
    return dbUtils_1.update('client', id, client, interface_1.ClientUpdateInput);
}
exports.updateClient = updateClient;
function deleteClient(id) {
    return dbUtils_1.remove('client', { id: id });
}
exports.deleteClient = deleteClient;
function getClientById(id) {
    return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT * FROM client WHERE id = ", ""], ["SELECT * FROM client WHERE id = ", ""])), id), interface_1.DatabaseClient);
}
exports.getClientById = getClientById;
var templateObject_1;
