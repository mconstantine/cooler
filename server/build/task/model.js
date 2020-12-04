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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectTasks = exports.getUserTasks = exports.getTaskProject = exports.deleteTask = exports.updateTask = exports.listTasks = exports.getTask = exports.createTasksBatch = exports.createTask = void 0;
var interface_1 = require("./interface");
var dbUtils_1 = require("../misc/dbUtils");
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var queryToConnection_1 = require("../misc/queryToConnection");
var function_1 = require("fp-ts/function");
var database_1 = require("../project/database");
var fp_ts_1 = require("fp-ts");
var Types_1 = require("../misc/Types");
var database_2 = require("./database");
var t = __importStar(require("io-ts"));
function createTask(input, user) {
    return function_1.pipe(database_1.getProjectById(input.project), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_404', 'Project task not found');
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (project) { return project.user === user.id; }, function () {
        return Types_1.coolerError('COOLER_403', 'You cannot create tasks for this project');
    })), fp_ts_1.taskEither.chain(function () { return database_2.insertTask(input); }), fp_ts_1.taskEither.chain(function (id) { return database_2.getTaskById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_500', 'Unable to retrieve the task after creation');
    })));
}
exports.createTask = createTask;
function createTasksBatch(input, user) {
    return function_1.pipe(database_1.getProjectById(input.project), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_404', 'Project task not found');
    })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (project) { return project.user === user.id; }, function () {
        return Types_1.coolerError('COOLER_403', 'You cannot create tasks for this project');
    })), fp_ts_1.taskEither.chain(function (project) {
        return function_1.pipe(dbUtils_1.dbGetAll(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n            SELECT start_time\n            FROM task\n            WHERE project = ", "\n          "], ["\n            SELECT start_time\n            FROM task\n            WHERE project = ", "\n          "])), project.id), t.type({ start_time: Types_1.DateFromSQLDate })), fp_ts_1.taskEither.chain(function (existingTasks) {
            var result = fp_ts_1.taskEither.fromIO(function_1.constVoid);
            var days = Math.ceil((input.to.getTime() - input.from.getTime()) / 86400000);
            var _loop_1 = function (i) {
                var start_time = new Date(input.from.getTime() + i * 86400000);
                if (existingTasks.find(function (task) {
                    return task.start_time.getFullYear() === start_time.getFullYear() &&
                        task.start_time.getMonth() === start_time.getMonth() &&
                        task.start_time.getDate() === start_time.getDate();
                })) {
                    return "continue";
                }
                start_time.setHours(input.start_time.getHours());
                start_time.setMinutes(input.start_time.getMinutes());
                start_time.setSeconds(input.start_time.getSeconds());
                var weekday = start_time.getDay();
                var bitMask = void 0;
                switch (weekday) {
                    case 0:
                        bitMask = 0x0000001;
                        break;
                    case 1:
                        bitMask = 0x0000010;
                        break;
                    case 2:
                        bitMask = 0x0000100;
                        break;
                    case 3:
                        bitMask = 0x0001000;
                        break;
                    case 4:
                        bitMask = 0x0010000;
                        break;
                    case 5:
                        bitMask = 0x0100000;
                        break;
                    case 6:
                        bitMask = 0x1000000;
                        break;
                    default:
                        bitMask = 0x0000000;
                        break;
                }
                if ((bitMask & input.repeat) === 0) {
                    return "continue";
                }
                result = function_1.pipe(result, fp_ts_1.taskEither.chain(function () {
                    return database_2.insertTask({
                        name: formatTaskName(input.name, start_time, i),
                        description: fp_ts_1.option.none,
                        project: input.project,
                        expectedWorkingHours: input.expectedWorkingHours,
                        hourlyCost: input.hourlyCost,
                        start_time: start_time
                    });
                }));
            };
            for (var i = 0; i <= days; i++) {
                _loop_1(i);
            }
            return result;
        }));
    }), fp_ts_1.taskEither.chain(function () { return database_1.getProjectById(input.project); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_500', 'Unable to retrieve the project after tasks batch creation');
    })));
}
exports.createTasksBatch = createTasksBatch;
var taskNamePattern = /^\s*#\s*$|^D{1,4}$|^M{1,4}$|^Y{1,4}$/;
function formatTaskName(name, date, index) {
    var didMatch = false;
    function match(matchFunction) {
        return function (s) {
            didMatch = true;
            return matchFunction(s);
        };
    }
    var matches = {
        '#': function () { return (index + 1).toString(10); },
        DDDD: function () { return date.toLocaleDateString(undefined, { weekday: 'long' }); },
        DDD: function () { return date.toLocaleDateString(undefined, { weekday: 'short' }); },
        DD: function () {
            var n = date.getDate();
            return (n < 10 ? '0' : '') + n;
        },
        D: function () { return date.getDate().toString(10); },
        MMMM: function () { return date.toLocaleString(undefined, { month: 'long' }); },
        MMM: function () { return date.toLocaleString(undefined, { month: 'short' }); },
        MM: function () {
            var n = date.getMonth() + 1;
            return (n < 10 ? '0' : '') + n;
        },
        M: function () { return (date.getMonth() + 1).toString(10); },
        YYYY: function () { return date.getFullYear().toString(10); },
        YY: function () { return date.getFullYear().toString(10).substring(2); }
    };
    return name
        .split(/\b/)
        .map(function (s) {
        var e_1, _a;
        if (!taskNamePattern.test(s)) {
            return s;
        }
        didMatch = false;
        var entries = Object.entries(matches);
        try {
            for (var entries_1 = __values(entries), entries_1_1 = entries_1.next(); !entries_1_1.done; entries_1_1 = entries_1.next()) {
                var _b = __read(entries_1_1.value, 2), target = _b[0], replacement = _b[1];
                s = s.replace(target, match(replacement));
                if (didMatch) {
                    return s;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (entries_1_1 && !entries_1_1.done && (_a = entries_1.return)) _a.call(entries_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return s;
    })
        .join('');
}
function getTask(id, user) {
    return function_1.pipe(database_2.getTaskById(id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'Task not found'); })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (task) { return task.user === user.id; }, function () { return Types_1.coolerError('COOLER_403', 'You cannot see this task'); })));
}
exports.getTask = getTask;
function listTasks(args, user) {
    var sql = sql_template_strings_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n    JOIN project ON project.id = task.project\n    JOIN client ON client.id = project.client\n    WHERE user = ", "\n  "], ["\n    JOIN project ON project.id = task.project\n    JOIN client ON client.id = project.client\n    WHERE user = ", "\n  "])), user.id);
    function_1.pipe(args.name, fp_ts_1.option.fold(function_1.constVoid, function (name) {
        return sql.append(sql_template_strings_1.default(templateObject_3 || (templateObject_3 = __makeTemplateObject([" AND project.name LIKE ", ""], [" AND project.name LIKE ", ""])), "%" + name + "%"));
    }));
    return queryToConnection_1.queryToConnection(args, ['task.*, client.user'], 'task', interface_1.Task, sql);
}
exports.listTasks = listTasks;
function updateTask(id, input, user) {
    return function_1.pipe(database_2.getTaskById(id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'Task not found'); })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (task) { return task.user === user.id; }, function () { return Types_1.coolerError('COOLER_403', 'You cannot update this task'); })), fp_ts_1.taskEither.chain(function () {
        return function_1.pipe(input.project, fp_ts_1.option.fromNullable, fp_ts_1.option.fold(function () { return fp_ts_1.taskEither.right(void 0); }, function_1.flow(database_1.getProjectById, fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
            return Types_1.coolerError('COOLER_404', 'New project not found');
        })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (project) { return project.user === user.id; }, function () {
            return Types_1.coolerError('COOLER_403', 'You cannot assign this project to a task');
        })), fp_ts_1.taskEither.map(function_1.constVoid))));
    }), fp_ts_1.taskEither.chain(function () { return database_2.updateTask(id, input); }), fp_ts_1.taskEither.chain(function () { return database_2.getTaskById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_500', 'Unable to retrieve the task after update');
    })));
}
exports.updateTask = updateTask;
function deleteTask(id, user) {
    return function_1.pipe(database_2.getTaskById(id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'Task not found'); })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (task) { return task.user === user.id; }, function () { return Types_1.coolerError('COOLER_403', 'You cannot delete this task'); })), fp_ts_1.taskEither.chain(function (task) {
        return function_1.pipe(database_2.deleteTask(task.id), fp_ts_1.taskEither.map(function () { return task; }));
    }));
}
exports.deleteTask = deleteTask;
function getTaskProject(task) {
    return function_1.pipe(database_1.getProjectById(task.project), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
        return Types_1.coolerError('COOLER_404', 'Project not found');
    })));
}
exports.getTaskProject = getTaskProject;
function getUserTasks(user, args) {
    var rest = sql_template_strings_1.default(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n    JOIN project ON project.id = task.project\n    JOIN client ON project.client = client.id\n    WHERE client.user = ", "\n  "], ["\n    JOIN project ON project.id = task.project\n    JOIN client ON project.client = client.id\n    WHERE client.user = ", "\n  "])), user.id);
    function_1.pipe(args.from, fp_ts_1.option.fold(function_1.constVoid, function_1.flow(Types_1.DateFromSQLDate.encode, function (from) {
        return rest.append(sql_template_strings_1.default(templateObject_5 || (templateObject_5 = __makeTemplateObject([" AND start_time >= ", ""], [" AND start_time >= ", ""])), from));
    })));
    function_1.pipe(args.to, fp_ts_1.option.fold(function_1.constVoid, function_1.flow(Types_1.DateFromSQLDate.encode, function (to) {
        return rest.append(sql_template_strings_1.default(templateObject_6 || (templateObject_6 = __makeTemplateObject([" AND start_time <= ", ""], [" AND start_time <= ", ""])), to));
    })));
    return queryToConnection_1.queryToConnection(args, ['task.*, client.user'], 'task', interface_1.DatabaseTask, rest);
}
exports.getUserTasks = getUserTasks;
function getProjectTasks(project, args) {
    return queryToConnection_1.queryToConnection(args, ['*'], 'task', interface_1.DatabaseTask, sql_template_strings_1.default(templateObject_7 || (templateObject_7 = __makeTemplateObject(["WHERE project = ", ""], ["WHERE project = ", ""])), project.id));
}
exports.getProjectTasks = getProjectTasks;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
