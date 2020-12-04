"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserTaxes = exports.getTaxUser = exports.deleteTax = exports.updateTax = exports.listTaxes = exports.getTax = exports.createTax = void 0;
var interface_1 = require("./interface");
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var queryToConnection_1 = require("../misc/queryToConnection");
var database_1 = require("./database");
var function_1 = require("fp-ts/function");
var fp_ts_1 = require("fp-ts");
var Types_1 = require("../misc/Types");
var database_2 = require("../user/database");
function createTax(input, user) {
    return function_1.pipe(database_1.insertTax(__assign(__assign({}, input), { user: user.id })), fp_ts_1.taskEither.chain(database_1.getTaxById), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_500', 'Unable to retrieve the tax after creation');
    })));
}
exports.createTax = createTax;
function getTax(id, user) {
    return function_1.pipe(database_1.getTaxById(id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'Tax not found'); })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (tax) { return tax.user === user.id; }, function () { return Types_1.coolerError('COOLER_403', 'You cannot see this tax'); })));
}
exports.getTax = getTax;
function listTaxes(args, user) {
    return queryToConnection_1.queryToConnection(args, ['tax.*'], 'tax', interface_1.Tax, sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["WHERE user = ", ""], ["WHERE user = ", ""])), user.id));
}
exports.listTaxes = listTaxes;
function updateTax(id, input, user) {
    return function_1.pipe(database_1.getTaxById(id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'Tax not found'); })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (tax) { return tax.user === user.id; }, function () { return Types_1.coolerError('COOLER_403', 'You cannot update this tax'); })), fp_ts_1.taskEither.chain(function (tax) {
        return database_1.updateTax(tax.id, __assign(__assign({}, input), { user: user.id }));
    }), fp_ts_1.taskEither.chain(function () { return database_1.getTaxById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_500', 'Unable to retrieve the tax after update');
    })));
}
exports.updateTax = updateTax;
function deleteTax(id, user) {
    return function_1.pipe(database_1.getTaxById(id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'Tax not found'); })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (tax) { return tax.user === user.id; }, function () { return Types_1.coolerError('COOLER_403', 'You cannot delete this tax'); })), fp_ts_1.taskEither.chain(function (tax) {
        return function_1.pipe(database_1.deleteTax(tax.id), fp_ts_1.taskEither.map(function () { return tax; }));
    }));
}
exports.deleteTax = deleteTax;
function getTaxUser(tax) {
    return function_1.pipe(database_2.getUserById(tax.user), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'User not found'); })));
}
exports.getTaxUser = getTaxUser;
function getUserTaxes(user, args) {
    return queryToConnection_1.queryToConnection(args, ['tax.*'], 'tax', interface_1.Tax, sql_template_strings_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["WHERE tax.user = ", ""], ["WHERE tax.user = ", ""])), user.id));
}
exports.getUserTaxes = getUserTaxes;
var templateObject_1, templateObject_2;
