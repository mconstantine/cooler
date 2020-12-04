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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserBalance = exports.getUserBudget = exports.getUserActualWorkingHours = exports.getUserExpectedWorkingHours = exports.getUserOpenSessions = exports.getProjectBalance = exports.getProjectBudget = exports.getProjectActualWorkingHours = exports.getProjectExpectedWorkingHours = exports.getTaskBalance = exports.getTaskBudget = exports.getTaskActualWorkingHours = exports.getTaskSessions = exports.getSessionTask = exports.createTimesheet = exports.deleteSession = exports.stopSession = exports.updateSession = exports.listSessions = exports.getSession = exports.startSession = void 0;
var interface_1 = require("./interface");
var ConnectionQueryArgs_1 = require("../misc/ConnectionQueryArgs");
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var dbUtils_1 = require("../misc/dbUtils");
var queryToConnection_1 = require("../misc/queryToConnection");
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var crypto_1 = __importDefault(require("crypto"));
var model_1 = require("../client/model");
var database_1 = require("./database");
var Types_1 = require("../misc/Types");
var function_1 = require("fp-ts/function");
var database_2 = require("../task/database");
var fp_ts_1 = require("fp-ts");
var t = __importStar(require("io-ts"));
var io_ts_types_1 = require("io-ts-types");
var database_3 = require("../project/database");
var Apply_1 = require("fp-ts/Apply");
var database_4 = require("../client/database");
var TIMESHEETS_PATH = '/public/timesheets';
function startSession(taskId, user) {
    return function_1.pipe(database_2.getTaskById(taskId), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_404', 'Session task not found');
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (task) { return task.user === user.id; }, function () {
        return Types_1.coolerError('COOLER_403', 'You cannot start a session for this task');
    })), fp_ts_1.taskEither.chain(function (task) {
        return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n          SELECT COUNT(*) as count\n          FROM session\n          WHERE task = ", " AND end_time IS NULL\n        "], ["\n          SELECT COUNT(*) as count\n          FROM session\n          WHERE task = ", " AND end_time IS NULL\n        "])), task.id), t.type({
            count: Types_1.NonNegativeInteger
        }));
    }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_500', 'Unable to count existing sessions');
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (_a) {
        var count = _a.count;
        return count === 0;
    }, function () {
        return Types_1.coolerError('COOLER_409', 'There is already an open session for this task');
    })), fp_ts_1.taskEither.chain(function () {
        return database_1.insertSession({
            task: taskId,
            start_time: new Date(),
            end_time: fp_ts_1.option.none
        });
    }), fp_ts_1.taskEither.chain(database_1.getSessionById), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_500', 'Unable to retieve session after creation');
    })));
}
exports.startSession = startSession;
function getSession(id, user) {
    return function_1.pipe(database_1.getSessionById(id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_404', 'Session not found');
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (session) { return session.user === user.id; }, function () { return Types_1.coolerError('COOLER_403', 'You cannot see this session'); })));
}
exports.getSession = getSession;
var SessionsConnectionQueryArgs = t.intersection([
    ConnectionQueryArgs_1.ConnectionQueryArgs,
    t.type({
        task: io_ts_types_1.optionFromNullable(Types_1.PositiveInteger)
    })
], 'SessionsConnectionQueryArgs');
function listSessions(args, user) {
    var sql = sql_template_strings_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n    JOIN task ON task.id = session.task\n    JOIN project ON project.id = task.project\n    JOIN client ON client.id = project.client\n    WHERE client.user = ", "\n  "], ["\n    JOIN task ON task.id = session.task\n    JOIN project ON project.id = task.project\n    JOIN client ON client.id = project.client\n    WHERE client.user = ", "\n  "])), user.id);
    function_1.pipe(args.task, fp_ts_1.option.fold(function_1.constVoid, function (task) { return sql.append(sql_template_strings_1.default(templateObject_3 || (templateObject_3 = __makeTemplateObject([" AND session.task = ", ""], [" AND session.task = ", ""])), task)); }));
    return queryToConnection_1.queryToConnection(args, ['session.*', 'client.user'], 'session', interface_1.DatabaseSession, sql);
}
exports.listSessions = listSessions;
function updateSession(id, input, user) {
    return function_1.pipe(database_1.getSessionById(id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_404', 'Session not found');
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (session) { return session.user === user.id; }, function () { return Types_1.coolerError('COOLER_403', 'You cannot update this session'); })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (session) {
        return fp_ts_1.option.isNone(session.end_time) ||
            (!!input.end_time && fp_ts_1.option.isSome(input.end_time));
    }, function () { return Types_1.coolerError('COOLER_409', 'You cannot reopen a closed session'); })), fp_ts_1.taskEither.chain(function (session) {
        return function_1.pipe(input.task, fp_ts_1.option.fromNullable, fp_ts_1.option.fold(function () { return fp_ts_1.taskEither.right(session); }, function (task) {
            return function_1.pipe(database_2.getTaskById(task), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
                return Types_1.coolerError('COOLER_404', 'Task not found');
            })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (task) { return task.user === user.id; }, function () {
                return Types_1.coolerError('COOLER_403', 'You cannot assign this task to a session');
            })), fp_ts_1.taskEither.map(function () { return session; }));
        }));
    }), fp_ts_1.taskEither.chain(function (session) { return database_1.updateSession(session.id, input); }), fp_ts_1.taskEither.chain(function () { return database_1.getSessionById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_500', 'Unable to find session after update');
    })));
}
exports.updateSession = updateSession;
function stopSession(id, user) {
    return updateSession(id, { end_time: fp_ts_1.option.some(new Date()) }, user);
}
exports.stopSession = stopSession;
function deleteSession(id, user) {
    return function_1.pipe(database_1.getSessionById(id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_404', 'Session not found');
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (session) { return session.user === user.id; }, function () { return Types_1.coolerError('COOLER_403', 'You cannot delete this session'); })), fp_ts_1.taskEither.chain(function (session) {
        return function_1.pipe(database_1.deleteSession(session.id), fp_ts_1.taskEither.map(function () { return session; }));
    }));
}
exports.deleteSession = deleteSession;
function createTimesheet(input, user) {
    var timesheetsDirectoryPath = path_1.default.join(process.cwd(), TIMESHEETS_PATH);
    var filename = crypto_1.default.randomBytes(12).toString('hex') + ".csv";
    return function_1.pipe(database_3.getProjectById(input.project), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_404', 'Project not found');
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (project) { return project.user === user.id; }, function () {
        return Types_1.coolerError('COOLER_403', 'You cannot create a timesheet for this project');
    })), fp_ts_1.taskEither.chain(function (project) {
        return Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
            client: function_1.pipe(database_4.getClientById(project.client), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
                return Types_1.coolerError('COOLER_404', 'Project client not found');
            }))),
            sessions: dbUtils_1.dbGetAll(sql_template_strings_1.default(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n            SELECT\n              project.name AS project_name,\n              task.name AS task_name,\n              task.start_time AS task_start_time,\n              MAX(session.end_time) AS task_end_time,\n              ROUND(SUM((\n                strftime('%s', session.end_time) - strftime('%s', session.start_time)\n              ) / 3600.0)) AS duration,\n              ROUND(task.hourlyCost * SUM((\n                strftime('%s', session.end_time) - strftime('%s', session.start_time)\n              ) / 3600.0), 2) AS balance\n            FROM session\n            JOIN task ON task.id = session.task\n            JOIN project ON project.id = task.project\n            JOIN client ON client.id = project.client\n            WHERE\n              task.project = ", " AND\n              session.start_time >= ", " AND\n              session.end_time IS NOT NULL AND\n              session.end_time <= ", "\n            GROUP BY task.id\n            ORDER BY task.start_time;\n          "], ["\n            SELECT\n              project.name AS project_name,\n              task.name AS task_name,\n              task.start_time AS task_start_time,\n              MAX(session.end_time) AS task_end_time,\n              ROUND(SUM((\n                strftime('%s', session.end_time) - strftime('%s', session.start_time)\n              ) / 3600.0)) AS duration,\n              ROUND(task.hourlyCost * SUM((\n                strftime('%s', session.end_time) - strftime('%s', session.start_time)\n              ) / 3600.0), 2) AS balance\n            FROM session\n            JOIN task ON task.id = session.task\n            JOIN project ON project.id = task.project\n            JOIN client ON client.id = project.client\n            WHERE\n              task.project = ", " AND\n              session.start_time >= ", " AND\n              session.end_time IS NOT NULL AND\n              session.end_time <= ", "\n            GROUP BY task.id\n            ORDER BY task.start_time;\n          "])), project.id, Types_1.DateFromSQLDate.encode(input.since), Types_1.DateFromSQLDate.encode(input.to)), t.type({
                project_name: io_ts_types_1.NonEmptyString,
                task_name: io_ts_types_1.NonEmptyString,
                task_start_time: Types_1.DateFromSQLDate,
                task_end_time: Types_1.DateFromSQLDate,
                duration: Types_1.NonNegativeNumber,
                balance: Types_1.NonNegativeNumber
            }))
        });
    }), fp_ts_1.taskEither.map(function (_a) {
        var client = _a.client, sessions = _a.sessions;
        var client_name = model_1.getClientName(client);
        return sessions.map(function (session) { return (__assign(__assign({}, session), { client_name: client_name })); });
    }), fp_ts_1.taskEither.chain(function (sessions) {
        return function_1.pipe(fp_ts_1.either.tryCatch(function () { return fs_1.default.existsSync(timesheetsDirectoryPath); }, function () {
            return Types_1.coolerError('COOLER_500', 'Unable to access the files directory');
        }), fp_ts_1.either.chain(fp_ts_1.boolean.fold(function () {
            return fp_ts_1.either.tryCatch(function () { return fs_1.default.mkdirSync(timesheetsDirectoryPath); }, function () {
                return Types_1.coolerError('COOLER_500', 'Unable to create the files directory');
            });
        }, function () { return fp_ts_1.either.right(void 0); })), fp_ts_1.either.chain(function () {
            return fp_ts_1.either.tryCatch(function () { return fs_1.default.readdirSync(timesheetsDirectoryPath); }, function () {
                return Types_1.coolerError('COOLER_500', 'Unable to read the files directory');
            });
        }), fp_ts_1.either.chain(function (files) {
            return function_1.pipe(files.filter(function (s) { return s.charAt(0) !== '.'; }), fp_ts_1.nonEmptyArray.fromArray, fp_ts_1.option.fold(function () { return fp_ts_1.either.right(undefined); }, fp_ts_1.nonEmptyArray.reduce(fp_ts_1.either.right(undefined), function (res, filename) {
                return function_1.pipe(res, fp_ts_1.either.chain(function () {
                    return fp_ts_1.either.tryCatch(function () {
                        return fs_1.default.unlinkSync(path_1.default.join(timesheetsDirectoryPath, filename));
                    }, function () {
                        return Types_1.coolerError('COOLER_500', 'Unable to delete old files');
                    });
                }), fp_ts_1.either.map(function_1.constUndefined));
            })));
        }), fp_ts_1.either.chain(function () {
            var handleString = function (s) { return "\"" + s.replace(/"/g, '\\"') + "\""; };
            var headers = [
                'Client',
                'Project',
                'Task',
                'Start time',
                'End time',
                'Duration (hours)',
                'Balance (€)'
            ].join(';');
            var rows = sessions.map(function (session) {
                return [
                    handleString(session.client_name),
                    handleString(session.project_name),
                    handleString(session.task_name),
                    session.task_start_time,
                    session.task_end_time,
                    session.duration,
                    session.balance
                ].join(';');
            });
            var content = __spread([headers], rows).join('\n');
            return fp_ts_1.either.tryCatch(function () {
                return fs_1.default.writeFileSync(path_1.default.join(timesheetsDirectoryPath, filename), content, 'utf8');
            }, function () { return Types_1.coolerError('COOLER_500', 'Unable to write file'); });
        }), fp_ts_1.taskEither.fromEither);
    }), fp_ts_1.taskEither.map(function () { return path_1.default.join(TIMESHEETS_PATH, filename); }));
}
exports.createTimesheet = createTimesheet;
function getSessionTask(session) {
    return function_1.pipe(database_2.getTaskById(session.task), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'Task not found'); })));
}
exports.getSessionTask = getSessionTask;
function getTaskSessions(task, args, user) {
    return listSessions(__assign(__assign({}, args), { task: fp_ts_1.option.some(task.id) }), user);
}
exports.getTaskSessions = getTaskSessions;
function getTaskActualWorkingHours(task) {
    return function_1.pipe(dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n        SELECT IFNULL(SUM((\n          strftime('%s', session.end_time) - strftime('%s', session.start_time)\n        ) / 3600.0), 0) AS actualWorkingHours\n        FROM session\n        WHERE task = ", " AND end_time IS NOT NULL\n      "], ["\n        SELECT IFNULL(SUM((\n          strftime('%s', session.end_time) - strftime('%s', session.start_time)\n        ) / 3600.0), 0) AS actualWorkingHours\n        FROM session\n        WHERE task = ", " AND end_time IS NOT NULL\n      "])), task.id), t.type({
        actualWorkingHours: t.number
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'Task not found'); })), fp_ts_1.taskEither.map(function (_a) {
        var actualWorkingHours = _a.actualWorkingHours;
        return actualWorkingHours;
    }));
}
exports.getTaskActualWorkingHours = getTaskActualWorkingHours;
function getTaskBudget(task) {
    return function_1.pipe(dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n        SELECT IFNULL(expectedWorkingHours * hourlyCost, 0) AS budget\n        FROM task\n        WHERE id = ", "\n      "], ["\n        SELECT IFNULL(expectedWorkingHours * hourlyCost, 0) AS budget\n        FROM task\n        WHERE id = ", "\n      "])), task.id), t.type({
        budget: t.number
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'Task not found'); })), fp_ts_1.taskEither.map(function (_a) {
        var budget = _a.budget;
        return budget;
    }));
}
exports.getTaskBudget = getTaskBudget;
function getTaskBalance(task) {
    return function_1.pipe(dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_7 || (templateObject_7 = __makeTemplateObject(["\n        SELECT IFNULL(SUM((\n          strftime('%s', session.end_time) - strftime('%s', session.start_time)\n        ) / 3600.0 * task.hourlyCost), 0) AS balance\n        FROM session\n        JOIN task ON task.id = session.task\n        WHERE task.id = ", "\n      "], ["\n        SELECT IFNULL(SUM((\n          strftime('%s', session.end_time) - strftime('%s', session.start_time)\n        ) / 3600.0 * task.hourlyCost), 0) AS balance\n        FROM session\n        JOIN task ON task.id = session.task\n        WHERE task.id = ", "\n      "])), task.id), t.type({
        balance: t.number
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'Task not found'); })), fp_ts_1.taskEither.map(function (_a) {
        var balance = _a.balance;
        return balance;
    }));
}
exports.getTaskBalance = getTaskBalance;
function getProjectExpectedWorkingHours(project) {
    return function_1.pipe(dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_8 || (templateObject_8 = __makeTemplateObject(["\n        SELECT IFNULL(SUM(expectedWorkingHours), 0) AS expectedWorkingHours\n        FROM task\n        WHERE project = ", "\n      "], ["\n        SELECT IFNULL(SUM(expectedWorkingHours), 0) AS expectedWorkingHours\n        FROM task\n        WHERE project = ", "\n      "])), project.id), t.type({
        expectedWorkingHours: t.number
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_404', 'Project not found');
    })), fp_ts_1.taskEither.map(function (_a) {
        var expectedWorkingHours = _a.expectedWorkingHours;
        return expectedWorkingHours;
    }));
}
exports.getProjectExpectedWorkingHours = getProjectExpectedWorkingHours;
function getProjectActualWorkingHours(project) {
    return function_1.pipe(dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_9 || (templateObject_9 = __makeTemplateObject(["\n        SELECT IFNULL(SUM((\n          strftime('%s', session.end_time) - strftime('%s', session.start_time)\n        ) / 3600.0), 0) AS actualWorkingHours\n        FROM session\n        JOIN task ON task.id = session.task\n        WHERE task.project = ", " AND session.end_time IS NOT NULL\n      "], ["\n        SELECT IFNULL(SUM((\n          strftime('%s', session.end_time) - strftime('%s', session.start_time)\n        ) / 3600.0), 0) AS actualWorkingHours\n        FROM session\n        JOIN task ON task.id = session.task\n        WHERE task.project = ", " AND session.end_time IS NOT NULL\n      "])), project.id), t.type({
        actualWorkingHours: t.number
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_404', 'Project not found');
    })), fp_ts_1.taskEither.map(function (_a) {
        var actualWorkingHours = _a.actualWorkingHours;
        return actualWorkingHours;
    }));
}
exports.getProjectActualWorkingHours = getProjectActualWorkingHours;
function getProjectBudget(project) {
    return function_1.pipe(dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_10 || (templateObject_10 = __makeTemplateObject(["\n        SELECT IFNULL(SUM(hourlyCost * expectedWorkingHours), 0) AS budget\n        FROM task\n        WHERE project = ", "\n      "], ["\n        SELECT IFNULL(SUM(hourlyCost * expectedWorkingHours), 0) AS budget\n        FROM task\n        WHERE project = ", "\n      "])), project.id), t.type({
        budget: t.number
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_404', 'Project not found');
    })), fp_ts_1.taskEither.map(function (_a) {
        var budget = _a.budget;
        return budget;
    }));
}
exports.getProjectBudget = getProjectBudget;
function getProjectBalance(project) {
    return function_1.pipe(dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_11 || (templateObject_11 = __makeTemplateObject(["\n        SELECT IFNULL(SUM((\n          strftime('%s', session.end_time) - strftime('%s', session.start_time)\n        ) / 3600.0 * task.hourlyCost), 0) AS balance\n        FROM session\n        JOIN task ON task.id = session.task\n        WHERE task.project = ", "\n      "], ["\n        SELECT IFNULL(SUM((\n          strftime('%s', session.end_time) - strftime('%s', session.start_time)\n        ) / 3600.0 * task.hourlyCost), 0) AS balance\n        FROM session\n        JOIN task ON task.id = session.task\n        WHERE task.project = ", "\n      "])), project.id), t.type({
        balance: t.number
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_404', 'Project not found');
    })), fp_ts_1.taskEither.map(function (_a) {
        var balance = _a.balance;
        return balance;
    }));
}
exports.getProjectBalance = getProjectBalance;
function getUserOpenSessions(user, args) {
    return queryToConnection_1.queryToConnection(args, ['session.*'], 'session', interface_1.DatabaseSession, sql_template_strings_1.default(templateObject_12 || (templateObject_12 = __makeTemplateObject(["\n      JOIN task ON task.id = session.task\n      JOIN project ON project.id = task.project\n      JOIN client ON client.id = project.client\n      WHERE client.user = ", " AND session.end_time IS NULL\n    "], ["\n      JOIN task ON task.id = session.task\n      JOIN project ON project.id = task.project\n      JOIN client ON client.id = project.client\n      WHERE client.user = ", " AND session.end_time IS NULL\n    "])), user.id));
}
exports.getUserOpenSessions = getUserOpenSessions;
function getUserExpectedWorkingHours(user, input) {
    var sql = sql_template_strings_1.default(templateObject_13 || (templateObject_13 = __makeTemplateObject(["\n    SELECT IFNULL(SUM(task.expectedWorkingHours), 0) AS expectedWorkingHours\n    FROM task\n    JOIN project ON project.id = task.project\n    JOIN client ON client.id = project.client\n    WHERE client.user = ", " AND project.cashed_at IS NULL\n  "], ["\n    SELECT IFNULL(SUM(task.expectedWorkingHours), 0) AS expectedWorkingHours\n    FROM task\n    JOIN project ON project.id = task.project\n    JOIN client ON client.id = project.client\n    WHERE client.user = ", " AND project.cashed_at IS NULL\n  "])), user.id);
    function_1.pipe(input.since, fp_ts_1.option.fold(function_1.constVoid, function (since) {
        return sql.append(sql_template_strings_1.default(templateObject_14 || (templateObject_14 = __makeTemplateObject([" AND task.start_time >= ", ""], [" AND task.start_time >= ", ""])), Types_1.DateFromSQLDate.encode(since)));
    }));
    return function_1.pipe(dbUtils_1.dbGet(sql, t.type({
        expectedWorkingHours: t.number
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'User not found'); })), fp_ts_1.taskEither.map(function (_a) {
        var expectedWorkingHours = _a.expectedWorkingHours;
        return expectedWorkingHours;
    }));
}
exports.getUserExpectedWorkingHours = getUserExpectedWorkingHours;
function getUserActualWorkingHours(user, input) {
    var sql = sql_template_strings_1.default(templateObject_15 || (templateObject_15 = __makeTemplateObject(["\n    SELECT IFNULL(SUM((\n      strftime('%s', session.end_time) - strftime('%s', session.start_time)\n    ) / 3600.0), 0) AS actualWorkingHours\n    FROM session\n    JOIN task ON task.id = session.task\n    JOIN project ON project.id = task.project\n    JOIN client ON client.id = project.client\n    WHERE client.user = ", " AND project.cashed_at IS NULL\n  "], ["\n    SELECT IFNULL(SUM((\n      strftime('%s', session.end_time) - strftime('%s', session.start_time)\n    ) / 3600.0), 0) AS actualWorkingHours\n    FROM session\n    JOIN task ON task.id = session.task\n    JOIN project ON project.id = task.project\n    JOIN client ON client.id = project.client\n    WHERE client.user = ", " AND project.cashed_at IS NULL\n  "])), user.id);
    function_1.pipe(input.since, fp_ts_1.option.fold(function_1.constVoid, function (since) {
        return sql.append(sql_template_strings_1.default(templateObject_16 || (templateObject_16 = __makeTemplateObject([" AND session.start_time >= ", ""], [" AND session.start_time >= ", ""])), Types_1.DateFromSQLDate.encode(since)));
    }));
    return function_1.pipe(dbUtils_1.dbGet(sql, t.type({
        actualWorkingHours: t.number
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'User not found'); })), fp_ts_1.taskEither.map(function (_a) {
        var actualWorkingHours = _a.actualWorkingHours;
        return actualWorkingHours;
    }));
}
exports.getUserActualWorkingHours = getUserActualWorkingHours;
function getUserBudget(user, input) {
    var sql = sql_template_strings_1.default(templateObject_17 || (templateObject_17 = __makeTemplateObject(["\n    SELECT IFNULL(SUM(expectedWorkingHours * hourlyCost), 0) AS budget\n    FROM task\n    JOIN project ON project.id = task.project\n    JOIN client ON client.id = project.client\n    WHERE client.user = ", " AND project.cashed_at IS NULL\n  "], ["\n    SELECT IFNULL(SUM(expectedWorkingHours * hourlyCost), 0) AS budget\n    FROM task\n    JOIN project ON project.id = task.project\n    JOIN client ON client.id = project.client\n    WHERE client.user = ", " AND project.cashed_at IS NULL\n  "])), user.id);
    function_1.pipe(input.since, fp_ts_1.option.fold(function_1.constVoid, function (since) {
        return sql.append(sql_template_strings_1.default(templateObject_18 || (templateObject_18 = __makeTemplateObject([" AND task.start_time >= ", ""], [" AND task.start_time >= ", ""])), Types_1.DateFromSQLDate.encode(since)));
    }));
    return function_1.pipe(dbUtils_1.dbGet(sql, t.type({
        budget: t.number
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'User not found'); })), fp_ts_1.taskEither.map(function (_a) {
        var budget = _a.budget;
        return budget;
    }));
}
exports.getUserBudget = getUserBudget;
function getUserBalance(user, input) {
    var sql = sql_template_strings_1.default(templateObject_19 || (templateObject_19 = __makeTemplateObject(["\n    SELECT IFNULL(SUM((\n      strftime('%s', session.end_time) - strftime('%s', session.start_time)\n    ) / 3600.0 * task.hourlyCost), 0) AS balance\n    FROM session\n    JOIN task ON task.id = session.task\n    JOIN project ON project.id = task.project\n    JOIN client ON client.id = project.client\n    WHERE project.cashed_at IS NULL AND client.user = ", "\n  "], ["\n    SELECT IFNULL(SUM((\n      strftime('%s', session.end_time) - strftime('%s', session.start_time)\n    ) / 3600.0 * task.hourlyCost), 0) AS balance\n    FROM session\n    JOIN task ON task.id = session.task\n    JOIN project ON project.id = task.project\n    JOIN client ON client.id = project.client\n    WHERE project.cashed_at IS NULL AND client.user = ", "\n  "])), user.id);
    function_1.pipe(input.since, fp_ts_1.option.fold(function_1.constVoid, function (since) {
        return sql.append(sql_template_strings_1.default(templateObject_20 || (templateObject_20 = __makeTemplateObject([" AND session.start_time >= ", ""], [" AND session.start_time >= ", ""])), Types_1.DateFromSQLDate.encode(since)));
    }));
    return function_1.pipe(dbUtils_1.dbGet(sql, t.type({
        balance: t.number
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'User not found'); })), fp_ts_1.taskEither.map(function (_a) {
        var balance = _a.balance;
        return balance;
    }));
}
exports.getUserBalance = getUserBalance;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20;
