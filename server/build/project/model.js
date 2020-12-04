"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientProjects = exports.getUserCashedBalance = exports.getUserProjects = exports.getProjectClient = exports.deleteProject = exports.updateProject = exports.listProjects = exports.getProject = exports.createProject = void 0;
var interface_1 = require("./interface");
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var queryToConnection_1 = require("../misc/queryToConnection");
var Types_1 = require("../misc/Types");
var function_1 = require("fp-ts/function");
var database_1 = require("../client/database");
var fp_ts_1 = require("fp-ts");
var database_2 = require("./database");
var t = __importStar(require("io-ts"));
var database_3 = require("./database");
var dbUtils_1 = require("../misc/dbUtils");
function createProject(_a, user) {
    var name = _a.name, description = _a.description, client = _a.client;
    return function_1.pipe(database_1.getClientById(client), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_404', 'Project client not found');
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (client) { return client.user === user.id; }, function () {
        return Types_1.coolerError('COOLER_403', 'You cannot create projects for this client');
    })), fp_ts_1.taskEither.chain(function () {
        return database_3.insertProject({ name: name, description: description, client: client, cashed: fp_ts_1.option.none });
    }), fp_ts_1.taskEither.chain(function (id) { return database_2.getProjectById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_500', 'Unable to retrieve the project after creation');
    })));
}
exports.createProject = createProject;
function getProject(id, user) {
    return function_1.pipe(database_2.getProjectById(id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_404', 'Project not found');
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (project) { return project.user === user.id; }, function () { return Types_1.coolerError('COOLER_403', 'You cannot see this project'); })));
}
exports.getProject = getProject;
function listProjects(args, user) {
    var sql = sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    JOIN client ON project.client = client.id\n    WHERE client.user = ", "\n  "], ["\n    JOIN client ON project.client = client.id\n    WHERE client.user = ", "\n  "])), user.id);
    function_1.pipe(args.name, fp_ts_1.option.fold(function_1.constVoid, function (name) {
        return sql.append(sql_template_strings_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject([" AND project.name LIKE ", ""], [" AND project.name LIKE ", ""])), "%" + name + "%"));
    }));
    return queryToConnection_1.queryToConnection(args, ['project.*, client.user'], 'project', interface_1.DatabaseProject, sql);
}
exports.listProjects = listProjects;
function updateProject(id, project, user) {
    var name = project.name, description = project.description, client = project.client, cashed = project.cashed;
    return function_1.pipe(database_2.getProjectById(id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_404', 'Project not found');
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (project) { return project.user === user.id; }, function () { return Types_1.coolerError('COOLER_403', 'You cannot update this project'); })), fp_ts_1.taskEither.chain(function (project) {
        return function_1.pipe(client !== undefined, fp_ts_1.boolean.fold(function () { return fp_ts_1.taskEither.right(void 0); }, function () {
            return function_1.pipe(database_1.getClientById(client), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
                return Types_1.coolerError('COOLER_404', 'Client not found');
            })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (client) { return client.user === user.id; }, function () {
                return Types_1.coolerError('COOLER_403', 'You cannot assign this client to a project');
            })), fp_ts_1.taskEither.map(function_1.constVoid));
        }), fp_ts_1.taskEither.chain(function () {
            return database_3.updateProject(project.id, {
                name: name,
                description: description,
                client: client,
                cashed: cashed
            });
        }), fp_ts_1.taskEither.chain(function () { return database_2.getProjectById(project.id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
            return Types_1.coolerError('COOLER_404', 'Project not found');
        })));
    }));
}
exports.updateProject = updateProject;
function deleteProject(id, user) {
    return function_1.pipe(database_2.getProjectById(id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_404', 'Project not found');
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (project) { return project.user === user.id; }, function () { return Types_1.coolerError('COOLER_403', 'You cannot delete this project'); })), fp_ts_1.taskEither.chain(function (project) {
        return function_1.pipe(database_3.deleteProject(project.id), fp_ts_1.taskEither.map(function () { return project; }));
    }));
}
exports.deleteProject = deleteProject;
function getProjectClient(project) {
    return function_1.pipe(database_1.getClientById(project.client), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'Client not found'); })));
}
exports.getProjectClient = getProjectClient;
function getUserProjects(user, args) {
    return queryToConnection_1.queryToConnection(args, ['project.*'], 'project', interface_1.DatabaseProject, sql_template_strings_1.default(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n      JOIN client ON client.id = project.client\n      WHERE client.user = ", "\n    "], ["\n      JOIN client ON client.id = project.client\n      WHERE client.user = ", "\n    "])), user.id));
}
exports.getUserProjects = getUserProjects;
function getUserCashedBalance(user, since) {
    var sql = sql_template_strings_1.default(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n    SELECT IFNULL(SUM(project.cashed_balance), 0) AS balance\n    FROM project\n    JOIN client ON client.id = project.client\n    WHERE client.user = ", " AND project.cashed_balance IS NOT NULL\n  "], ["\n    SELECT IFNULL(SUM(project.cashed_balance), 0) AS balance\n    FROM project\n    JOIN client ON client.id = project.client\n    WHERE client.user = ", " AND project.cashed_balance IS NOT NULL\n  "])), user.id);
    function_1.pipe(since, fp_ts_1.option.fold(function_1.constVoid, function (since) {
        return sql.append(sql_template_strings_1.default(templateObject_5 || (templateObject_5 = __makeTemplateObject([" AND project.cashed_at >= ", ""], [" AND project.cashed_at >= ", ""])), Types_1.DateFromSQLDate.encode(since)));
    }));
    var Result = t.type({
        balance: Types_1.NonNegativeNumber
    });
    return function_1.pipe(dbUtils_1.dbGet(sql, Result), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_500', 'Unable to retrieve user balance');
    })), fp_ts_1.taskEither.map(function (_a) {
        var balance = _a.balance;
        return balance;
    }));
}
exports.getUserCashedBalance = getUserCashedBalance;
function getClientProjects(client, args) {
    return queryToConnection_1.queryToConnection(args, ['*'], 'project', interface_1.DatabaseProject, sql_template_strings_1.default(templateObject_6 || (templateObject_6 = __makeTemplateObject(["WHERE client = ", ""], ["WHERE client = ", ""])), client.id));
}
exports.getClientProjects = getClientProjects;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
