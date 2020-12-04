"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTax = exports.updateTax = exports.insertTax = exports.getTaxById = void 0;
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var dbUtils_1 = require("../misc/dbUtils");
var interface_1 = require("./interface");
function getTaxById(id) {
    return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT * FROM tax WHERE id = ", ""], ["SELECT * FROM tax WHERE id = ", ""])), id), interface_1.Tax);
}
exports.getTaxById = getTaxById;
function insertTax(tax) {
    return dbUtils_1.insert('tax', tax, interface_1.TaxCreationInput);
}
exports.insertTax = insertTax;
function updateTax(id, tax) {
    return dbUtils_1.update('tax', id, tax, interface_1.TaxUpdateInput);
}
exports.updateTax = updateTax;
function deleteTax(id) {
    return dbUtils_1.remove('tax', { id: id });
}
exports.deleteTax = deleteTax;
var templateObject_1;
