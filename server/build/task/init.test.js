"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var init_1 = require("../init");
var dbUtils_1 = require("../misc/dbUtils");
var getFakeProject_1 = require("../test/getFakeProject");
var getFakeClient_1 = require("../test/getFakeClient");
var getFakeUser_1 = require("../test/getFakeUser");
var interface_1 = require("../project/interface");
var function_1 = require("fp-ts/function");
var util_1 = require("../test/util");
var registerUser_1 = require("../test/registerUser");
var fp_ts_1 = require("fp-ts");
var database_1 = require("../client/database");
var database_2 = require("../project/database");
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var getFakeTask_1 = require("../test/getFakeTask");
var interface_2 = require("./interface");
var io_ts_1 = require("io-ts");
var sleep_1 = require("../test/sleep");
describe('initTask', function () {
    var user;
    var project;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    process.env.SECRET = 'shhhhh';
                    return [4, function_1.pipe(init_1.init(), util_1.testTaskEither(function_1.constVoid))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    delete process.env.SECRET;
                    return [4, function_1.pipe(dbUtils_1.remove('user'), util_1.testTaskEither(function_1.constVoid))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    describe('happy path', function () {
        var client;
        beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(registerUser_1.registerUser(getFakeUser_1.getFakeUser()), fp_ts_1.taskEither.chain(function (u) {
                            user = u;
                            return database_1.insertClient(getFakeClient_1.getFakeClient(u.id));
                        }), fp_ts_1.taskEither.chain(database_1.getClientById), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), fp_ts_1.taskEither.chain(function (c) {
                            client = c;
                            return database_2.insertProject(getFakeProject_1.getFakeProject(client.id));
                        }), fp_ts_1.taskEither.chain(database_2.getProjectById), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), util_1.testTaskEither(function (p) {
                            project = p;
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should create a database table', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(dbUtils_1.dbExec(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT * FROM task"], ["SELECT * FROM task"])))), util_1.testTaskEither(function_1.constVoid))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should save dates in SQL format', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(dbUtils_1.insert('task', getFakeTask_1.getFakeTask(project.id), interface_2.TaskCreationInput), fp_ts_1.taskEither.chain(function (id) {
                            return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["SELECT * FROM task WHERE id = ", ""], ["SELECT * FROM task WHERE id = ", ""])), id), io_ts_1.UnknownRecord);
                        }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), util_1.testTaskEither(function (task) {
                            var sqlDatePattern = /\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/;
                            expect(task.start_time).toMatch(sqlDatePattern);
                            expect(task.created_at).toMatch(sqlDatePattern);
                            expect(task.updated_at).toMatch(sqlDatePattern);
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should save the creation time automatically', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(dbUtils_1.insert('task', getFakeTask_1.getFakeTask(project.id), interface_2.TaskCreationInput), fp_ts_1.taskEither.chain(function (id) {
                            return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n              SELECT task.*, client.user\n              FROM task\n              JOIN project ON task.project = project.id\n              JOIN client ON project.client = client.id\n              WHERE task.id = ", "\n            "], ["\n              SELECT task.*, client.user\n              FROM task\n              JOIN project ON task.project = project.id\n              JOIN client ON project.client = client.id\n              WHERE task.id = ", "\n            "])), id), interface_2.DatabaseTask);
                        }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), util_1.testTaskEither(function (task) {
                            expect(interface_2.Task.is(task)).toBe(true);
                            expect(task.created_at).toBeInstanceOf(Date);
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should keep track of the time of the last update', function () { return __awaiter(void 0, void 0, void 0, function () {
            var updateData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updateData = { name: 'Some weird name' };
                        return [4, function_1.pipe(dbUtils_1.insert('task', getFakeTask_1.getFakeTask(project.id), interface_2.TaskCreationInput), fp_ts_1.taskEither.chain(function (id) {
                                return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n              SELECT task.*, client.user\n              FROM task\n              JOIN project ON task.project = project.id\n              JOIN client ON project.client = client.id\n              WHERE task.id = ", "\n            "], ["\n              SELECT task.*, client.user\n              FROM task\n              JOIN project ON task.project = project.id\n              JOIN client ON project.client = client.id\n              WHERE task.id = ", "\n            "])), id), interface_2.DatabaseTask);
                            }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), fp_ts_1.taskEither.chain(function (task) { return fp_ts_1.taskEither.fromTask(sleep_1.sleep(1000, task)); }), fp_ts_1.taskEither.chain(function (task) {
                                return function_1.pipe(dbUtils_1.update('task', task.id, updateData, interface_2.TaskUpdateInput), fp_ts_1.taskEither.chain(function () {
                                    return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n                  SELECT task.*, client.user\n                  FROM task\n                  JOIN project ON task.project = project.id\n                  JOIN client ON project.client = client.id\n                  WHERE task.id = ", "\n                "], ["\n                  SELECT task.*, client.user\n                  FROM task\n                  JOIN project ON task.project = project.id\n                  JOIN client ON project.client = client.id\n                  WHERE task.id = ", "\n                "])), task.id), interface_2.DatabaseTask);
                                }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), fp_ts_1.taskEither.map(function (_a) {
                                    var updated_at = _a.updated_at;
                                    return ({
                                        before: task.updated_at,
                                        after: updated_at
                                    });
                                }));
                            }), util_1.testTaskEither(function (_a) {
                                var before = _a.before, after = _a.after;
                                expect(before.getTime()).not.toBe(after.getTime());
                            }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it("should delete all project's tasks when a project is deleted", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(dbUtils_1.insert('project', getFakeProject_1.getFakeProject(client.id), interface_1.ProjectCreationInput), fp_ts_1.taskEither.chain(function (projectId) {
                            return function_1.pipe(dbUtils_1.insert('task', getFakeTask_1.getFakeTask(projectId), interface_2.TaskCreationInput), fp_ts_1.taskEither.chain(function (taskId) {
                                return function_1.pipe(dbUtils_1.remove('project', { id: projectId }), fp_ts_1.taskEither.chain(function () {
                                    return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n                      SELECT task.*, client.user\n                      FROM task\n                      JOIN project ON task.project = project.id\n                      JOIN client ON project.client = client.id\n                      WHERE task.id = ", "\n                    "], ["\n                      SELECT task.*, client.user\n                      FROM task\n                      JOIN project ON task.project = project.id\n                      JOIN client ON project.client = client.id\n                      WHERE task.id = ", "\n                    "])), taskId), interface_2.DatabaseTask);
                                }));
                            }));
                        }), util_1.testTaskEither(function (result) {
                            expect(fp_ts_1.option.isNone(result)).toBe(true);
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
    });
    describe('deletion chain', function () {
        it('should make user deletion bubble down to tasks', function () { return __awaiter(void 0, void 0, void 0, function () {
            var userId, taskId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(registerUser_1.registerUser(getFakeUser_1.getFakeUser(), user), fp_ts_1.taskEither.chain(function (user) {
                            userId = user.id;
                            return database_1.insertClient(getFakeClient_1.getFakeClient(user.id));
                        }), fp_ts_1.taskEither.chain(function (clientId) { return database_2.insertProject(getFakeProject_1.getFakeProject(clientId)); }), fp_ts_1.taskEither.chain(function (projectId) {
                            return dbUtils_1.insert('task', getFakeTask_1.getFakeTask(projectId), interface_2.TaskCreationInput);
                        }), fp_ts_1.taskEither.chain(function (id) {
                            taskId = id;
                            return dbUtils_1.remove('user', { id: userId });
                        }), fp_ts_1.taskEither.chain(function () {
                            return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_7 || (templateObject_7 = __makeTemplateObject(["SELECT * FROM task WHERE id = ", ""], ["SELECT * FROM task WHERE id = ", ""])), taskId), interface_2.DatabaseTask);
                        }), util_1.testTaskEither(function (result) {
                            expect(fp_ts_1.option.isNone(result)).toBe(true);
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
    });
    describe('project update', function () {
        it('should update the project when a task is created for it', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(database_2.getProjectById(project.id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), fp_ts_1.taskEither.chain(function (project) { return fp_ts_1.taskEither.fromTask(sleep_1.sleep(1000, project)); }), fp_ts_1.taskEither.chain(function (project) {
                            return function_1.pipe(dbUtils_1.insert('task', getFakeTask_1.getFakeTask(project.id), interface_2.TaskCreationInput), fp_ts_1.taskEither.chain(function () { return database_2.getProjectById(project.id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), fp_ts_1.taskEither.map(function (_a) {
                                var updated_at = _a.updated_at;
                                return ({
                                    before: project.updated_at,
                                    after: updated_at
                                });
                            }));
                        }), util_1.testTaskEither(function (_a) {
                            var before = _a.before, after = _a.after;
                            expect(before.getTime()).not.toBe(after.getTime());
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
    });
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
