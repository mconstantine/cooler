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
exports.getUserClients = exports.getClientUser = exports.getClientName = exports.deleteClient = exports.updateClient = exports.listClients = exports.getClient = exports.createClient = void 0;
var interface_1 = require("./interface");
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var queryToConnection_1 = require("../misc/queryToConnection");
var function_1 = require("fp-ts/function");
var fp_ts_1 = require("fp-ts");
var database_1 = require("./database");
var Types_1 = require("../misc/Types");
var database_2 = require("../user/database");
function createClient(input, user) {
    var commonInput = {
        address_city: input.address_city,
        address_country: input.address_country,
        address_email: input.address_email,
        address_province: input.address_province,
        address_street: input.address_street,
        address_street_number: input.address_street_number,
        address_zip: input.address_zip,
        user: user.id
    };
    return function_1.pipe(input, interface_1.foldClientCreationInput(function (input) { return (__assign(__assign({}, commonInput), { type: input.type, first_name: input.first_name, last_name: input.last_name, fiscal_code: input.fiscal_code })); }, function (input) { return (__assign(__assign({}, commonInput), { type: input.type, country_code: input.country_code, business_name: input.business_name, vat_number: input.vat_number })); }), database_1.insertClient, fp_ts_1.taskEither.chain(function (id) { return database_1.getClientById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_500', 'Unable to retrieve the client after creation');
    })));
}
exports.createClient = createClient;
function getClient(id, user) {
    return function_1.pipe(database_1.getClientById(id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'Client not found'); })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (client) { return client.user === user.id; }, function () { return Types_1.coolerError('COOLER_403', 'You cannot see this client'); })));
}
exports.getClient = getClient;
function listClients(args, user) {
    var where = sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["WHERE user = ", ""], ["WHERE user = ", ""])), user.id);
    function_1.pipe(args.name, fp_ts_1.option.fold(function_1.constVoid, function (name) {
        return where.append(sql_template_strings_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n        AND (\n          (type = 'BUSINESS' AND business_name LIKE ", ") OR\n          (type = 'PRIVATE' AND first_name || ' ' || last_name LIKE ", ")\n        )"], ["\n        AND (\n          (type = 'BUSINESS' AND business_name LIKE ", ") OR\n          (type = 'PRIVATE' AND first_name || ' ' || last_name LIKE ", ")\n        )"])), "%" + name + "%", "%" + name + "%"));
    }));
    return queryToConnection_1.queryToConnection(args, ['*'], 'client', interface_1.DatabaseClient, where);
}
exports.listClients = listClients;
function updateClient(id, input, user) {
    return function_1.pipe(database_1.getClientById(id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'Client not found'); })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (client) { return (input.user || client.user) === user.id; }, function () { return Types_1.coolerError('COOLER_403', 'You cannot update this client'); })), fp_ts_1.taskEither.chain(function (client) {
        var commonInput = {
            address_country: input.address_country,
            address_province: input.address_province,
            address_city: input.address_city,
            address_zip: input.address_zip,
            address_street: input.address_street,
            address_street_number: input.address_street_number,
            address_email: input.address_email,
            user: user.id
        };
        var update = function_1.pipe(__assign(__assign({}, input), { type: input.type || client.type }), interface_1.foldClientUpdateInput(function (input) { return (__assign(__assign({}, commonInput), { type: input.type, first_name: input.first_name, last_name: input.last_name, fiscal_code: input.fiscal_code })); }, function (input) { return (__assign(__assign({}, commonInput), { type: input.type, country_code: input.country_code, business_name: input.business_name, vat_number: input.vat_number })); }));
        return function_1.pipe(database_1.updateClient(client.id, update), fp_ts_1.taskEither.map(function () { return client; }));
    }), fp_ts_1.taskEither.chain(function (client) { return database_1.getClientById(client.id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'Client not found'); })));
}
exports.updateClient = updateClient;
function deleteClient(id, user) {
    return function_1.pipe(database_1.getClientById(id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'Client not found'); })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (client) { return client.user === user.id; }, function () { return Types_1.coolerError('COOLER_403', 'You cannot delete this client'); })), fp_ts_1.taskEither.chain(function (client) {
        return function_1.pipe(database_1.deleteClient(client.id), fp_ts_1.taskEither.map(function () { return client; }));
    }));
}
exports.deleteClient = deleteClient;
function getClientName(client) {
    return function_1.pipe(client, interface_1.foldClient(function (client) { return client.first_name + " " + client.last_name; }, function (client) { return client.business_name; }));
}
exports.getClientName = getClientName;
function getClientUser(client) {
    return function_1.pipe(database_2.getUserById(client.user), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'User not found'); })));
}
exports.getClientUser = getClientUser;
function getUserClients(user, args) {
    return queryToConnection_1.queryToConnection(args, ['*'], 'client', interface_1.Client, sql_template_strings_1.default(templateObject_3 || (templateObject_3 = __makeTemplateObject(["WHERE user = ", ""], ["WHERE user = ", ""])), user.id));
}
exports.getUserClients = getUserClients;
var templateObject_1, templateObject_2, templateObject_3;
