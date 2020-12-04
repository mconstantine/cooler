"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.insertUser = exports.getUserById = exports.getUserByEmail = void 0;
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var dbUtils_1 = require("../misc/dbUtils");
var interface_1 = require("./interface");
function getUserByEmail(email) {
    return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT * FROM user WHERE email = ", ""], ["SELECT * FROM user WHERE email = ", ""])), email), interface_1.DatabaseUser);
}
exports.getUserByEmail = getUserByEmail;
function getUserById(id) {
    return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["SELECT * FROM user WHERE id = ", ""], ["SELECT * FROM user WHERE id = ", ""])), id), interface_1.DatabaseUser);
}
exports.getUserById = getUserById;
function insertUser(user) {
    return dbUtils_1.insert('user', user, interface_1.UserCreationInput);
}
exports.insertUser = insertUser;
function updateUser(id, user) {
    return dbUtils_1.update('user', id, user, interface_1.UserUpdateInput);
}
exports.updateUser = updateUser;
function deleteUser(id) {
    return dbUtils_1.remove('user', { id: id });
}
exports.deleteUser = deleteUser;
var templateObject_1, templateObject_2;
