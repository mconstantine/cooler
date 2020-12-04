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
var fp_ts_1 = require("fp-ts");
var function_1 = require("fp-ts/function");
var Apply_1 = require("fp-ts/Apply");
var io_ts_1 = require("io-ts");
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var database_1 = require("../client/database");
var init_1 = require("../init");
var dbUtils_1 = require("../misc/dbUtils");
var database_2 = require("../project/database");
var database_3 = require("../task/database");
var getFakeClient_1 = require("../test/getFakeClient");
var getFakeProject_1 = require("../test/getFakeProject");
var getFakeSession_1 = require("../test/getFakeSession");
var getFakeTask_1 = require("../test/getFakeTask");
var getFakeUser_1 = require("../test/getFakeUser");
var registerUser_1 = require("../test/registerUser");
var sleep_1 = require("../test/sleep");
var util_1 = require("../test/util");
var interface_1 = require("./interface");
describe('init', function () {
    var user;
    var client;
    var project;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    process.env.SECRET = 'shhhhh';
                    return [4, function_1.pipe(init_1.init(), util_1.testTaskEither(function_1.constVoid))];
                case 1:
                    _a.sent();
                    return [4, function_1.pipe(registerUser_1.registerUser(getFakeUser_1.getFakeUser()), util_1.testTaskEither(function (u) {
                            user = u;
                        }))];
                case 2:
                    _a.sent();
                    return [4, function_1.pipe(database_1.insertClient(getFakeClient_1.getFakeClient(user.id)), util_1.testTaskEither(function (c) {
                            client = c;
                        }))];
                case 3:
                    _a.sent();
                    return [4, function_1.pipe(database_2.insertProject(getFakeProject_1.getFakeProject(client)), util_1.testTaskEither(function (p) {
                            project = p;
                        }))];
                case 4:
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
        it('should create a database table', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(dbUtils_1.dbExec(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT * FROM session"], ["SELECT * FROM session"])))), util_1.testTaskEither(function_1.constVoid))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it("should delete all task's sessions when a task is deleted", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(database_3.insertTask(getFakeTask_1.getFakeTask(project)), fp_ts_1.taskEither.chain(function (taskId) {
                            return function_1.pipe(dbUtils_1.insert('session', getFakeSession_1.getFakeSession(taskId), interface_1.SessionCreationInput), fp_ts_1.taskEither.chain(function (sessionId) {
                                return function_1.pipe(database_3.deleteTask(taskId), fp_ts_1.taskEither.chain(function () {
                                    return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["SELECT * FROM session WHERE id = ", ""], ["SELECT * FROM session WHERE id = ", ""])), sessionId), io_ts_1.UnknownRecord);
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
        it('should make user deletion bubble down to sessions', function () { return __awaiter(void 0, void 0, void 0, function () {
            var userId, sessionId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(registerUser_1.registerUser(getFakeUser_1.getFakeUser(), user), util_1.testTaskEither(function (user) {
                            userId = user.id;
                        }))];
                    case 1:
                        _a.sent();
                        return [4, function_1.pipe(database_1.insertClient(getFakeClient_1.getFakeClient(userId)), fp_ts_1.taskEither.chain(function (clientId) { return database_2.insertProject(getFakeProject_1.getFakeProject(clientId)); }), fp_ts_1.taskEither.chain(function (projectId) { return database_3.insertTask(getFakeTask_1.getFakeTask(projectId)); }), fp_ts_1.taskEither.chain(function (taskId) {
                                return dbUtils_1.insert('session', getFakeSession_1.getFakeSession(taskId), interface_1.SessionCreationInput);
                            }), util_1.testTaskEither(function (id) {
                                sessionId = id;
                            }))];
                    case 2:
                        _a.sent();
                        return [4, function_1.pipe(dbUtils_1.remove('user', { id: userId }), fp_ts_1.taskEither.chain(function () {
                                return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_3 || (templateObject_3 = __makeTemplateObject(["SELECT * FROM session WHERE id = ", ""], ["SELECT * FROM session WHERE id = ", ""])), sessionId), io_ts_1.UnknownRecord);
                            }), util_1.testTaskEither(function (session) {
                                expect(fp_ts_1.option.isNone(session)).toBe(true);
                            }))];
                    case 3:
                        _a.sent();
                        return [2];
                }
            });
        }); });
    });
    describe('update chain', function () {
        it('should update the task and project when a session is created for them', function () { return __awaiter(void 0, void 0, void 0, function () {
            var project, task, projectUpdatedAtBefore, taskUpdatedAtBefore;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(registerUser_1.registerUser(getFakeUser_1.getFakeUser(), user), fp_ts_1.taskEither.chain(function (user) { return database_1.insertClient(getFakeClient_1.getFakeClient(user.id)); }), fp_ts_1.taskEither.chain(function (clientId) { return database_2.insertProject(getFakeProject_1.getFakeProject(clientId)); }), fp_ts_1.taskEither.chain(function (id) { return database_2.getProjectById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), util_1.testTaskEither(function (p) {
                            project = p;
                        }))];
                    case 1:
                        _a.sent();
                        return [4, function_1.pipe(database_3.insertTask(getFakeTask_1.getFakeTask(project.id)), fp_ts_1.taskEither.chain(function (id) { return database_3.getTaskById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), util_1.testTaskEither(function (t) {
                                task = t;
                            }))];
                    case 2:
                        _a.sent();
                        projectUpdatedAtBefore = project.updated_at;
                        taskUpdatedAtBefore = task.updated_at;
                        return [4, function_1.pipe(sleep_1.sleep(1000, null), fp_ts_1.taskEither.fromTask, fp_ts_1.taskEither.chain(function () {
                                return dbUtils_1.insert('session', getFakeSession_1.getFakeSession(task.id), interface_1.SessionCreationInput);
                            }), fp_ts_1.taskEither.chain(function () {
                                return Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                                    projectUpdatedAtAfter: function_1.pipe(database_2.getProjectById(project.id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), fp_ts_1.taskEither.map(function (_a) {
                                        var updated_at = _a.updated_at;
                                        return updated_at;
                                    })),
                                    taskUpdatedAtAfter: function_1.pipe(database_3.getTaskById(task.id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), fp_ts_1.taskEither.map(function (_a) {
                                        var updated_at = _a.updated_at;
                                        return updated_at;
                                    }))
                                });
                            }), util_1.testTaskEither(function (_a) {
                                var projectUpdatedAtAfter = _a.projectUpdatedAtAfter, taskUpdatedAtAfter = _a.taskUpdatedAtAfter;
                                expect(projectUpdatedAtBefore).not.toBe(projectUpdatedAtAfter);
                                expect(taskUpdatedAtBefore).not.toBe(taskUpdatedAtAfter);
                            }))];
                    case 3:
                        _a.sent();
                        return [2];
                }
            });
        }); });
    });
});
var templateObject_1, templateObject_2, templateObject_3;
