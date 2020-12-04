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
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var interface_1 = require("../client/interface");
var getFakeClient_1 = require("../test/getFakeClient");
var getFakeUser_1 = require("../test/getFakeUser");
var init_1 = require("../init");
var function_1 = require("fp-ts/function");
var registerUser_1 = require("../test/registerUser");
var fp_ts_1 = require("fp-ts");
var model_1 = require("../client/model");
var dbUtils_1 = require("../misc/dbUtils");
var getFakeProject_1 = require("../test/getFakeProject");
var interface_2 = require("./interface");
var util_1 = require("../test/util");
var sleep_1 = require("../test/sleep");
var t = __importStar(require("io-ts"));
describe('initProject', function () {
    describe('happy path', function () {
        var client;
        var user;
        beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        process.env.SECRET = 'shhhhh';
                        return [4, init_1.init()()];
                    case 1:
                        _a.sent();
                        return [4, function_1.pipe(registerUser_1.registerUser(getFakeUser_1.getFakeUser()), fp_ts_1.taskEither.map(function (u) {
                                user = u;
                                return u;
                            }), fp_ts_1.taskEither.chain(function (user) { return model_1.createClient(getFakeClient_1.getFakeClient(user.id), user); }), fp_ts_1.taskEither.map(function (c) {
                                client = c;
                                return c;
                            }))()];
                    case 2:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, dbUtils_1.remove('user')()];
                    case 1:
                        _a.sent();
                        delete process.env.SECRET;
                        return [2];
                }
            });
        }); });
        it('should create a database table', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, dbUtils_1.dbExec(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT * FROM project"], ["SELECT * FROM project"]))))()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should save the creation time automatically', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(getFakeProject_1.getFakeProject(client.id), function (project) { return dbUtils_1.insert('project', project, interface_2.ProjectCreationInput); }, fp_ts_1.taskEither.chain(function (lastID) { return getProjectById(lastID); }), util_1.testTaskEither(function (project) {
                            expect(interface_2.DatabaseProject.is(project)).toBe(true);
                            expect(project.created_at).toBeInstanceOf(Date);
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should keep track of the time of the last update', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(dbUtils_1.insert('project', getFakeProject_1.getFakeProject(client.id), interface_2.ProjectCreationInput), fp_ts_1.taskEither.chain(function (lastID) { return getProjectById(lastID); }), fp_ts_1.taskEither.chain(function (before) {
                            return function_1.pipe(sleep_1.sleep(1000, null), fp_ts_1.taskEither.fromTask, fp_ts_1.taskEither.chain(function () {
                                return dbUtils_1.update('project', before.id, { name: 'Some weird name' }, interface_2.ProjectUpdateInput);
                            }), fp_ts_1.taskEither.chain(function () { return getProjectById(before.id); }), fp_ts_1.taskEither.map(function (after) { return ({ before: before, after: after }); }));
                        }), util_1.testTaskEither(function (_a) {
                            var before = _a.before, after = _a.after;
                            expect(before.updated_at.getTime()).not.toBe(after.updated_at.getTime());
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it("should delete all client's projects when the client is deleted", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(registerUser_1.registerUser(getFakeUser_1.getFakeUser(), user), fp_ts_1.taskEither.chain(function (_a) {
                            var userId = _a.id;
                            return function_1.pipe(dbUtils_1.insert('client', getFakeClient_1.getFakeClient(userId), interface_1.ClientCreationInput), fp_ts_1.taskEither.chain(function (clientId) {
                                return dbUtils_1.insert('project', getFakeProject_1.getFakeProject(clientId), interface_2.ProjectCreationInput);
                            }), fp_ts_1.taskEither.chain(function (projectId) { return getProjectById(projectId); }), fp_ts_1.taskEither.chain(function (project) {
                                return function_1.pipe(dbUtils_1.remove('user', { id: userId }), fp_ts_1.taskEither.chain(function () {
                                    return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["SELECT * FROM project WHERE id = ", ""], ["SELECT * FROM project WHERE id = ", ""])), project.id), interface_2.DatabaseProject);
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
        it('should set cashed_balance to null if cashed_at is set to null', function () { return __awaiter(void 0, void 0, void 0, function () {
            var project;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(dbUtils_1.insert('project', getFakeProject_1.getFakeProject(client.id, {
                            cashed: fp_ts_1.option.some({
                                at: new Date(Date.UTC(1990, 0, 1)),
                                balance: 42
                            })
                        }), interface_2.ProjectCreationInput), fp_ts_1.taskEither.chain(getProjectById), util_1.testTaskEither(function (project) {
                            expect(interface_2.DatabaseProject.encode(project)).toMatchObject({
                                cashed_at: '1990-01-01T00:00:00.000Z',
                                cashed_balance: 42
                            });
                            return project;
                        }))];
                    case 1:
                        project = _a.sent();
                        return [4, function_1.pipe(dbUtils_1.dbRun(sql_template_strings_1.default(templateObject_3 || (templateObject_3 = __makeTemplateObject(["UPDATE project SET cashed_at = NULL WHERE id = ", ""], ["UPDATE project SET cashed_at = NULL WHERE id = ", ""])), project.id)), fp_ts_1.taskEither.chain(function () { return getProjectById(project.id); }), util_1.testTaskEither(function (project) {
                                expect(fp_ts_1.option.isNone(project.cashed)).toBe(true);
                                expect(interface_2.DatabaseProject.encode(project)).toMatchObject({
                                    cashed_at: null,
                                    cashed_balance: null
                                });
                            }))];
                    case 2:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should set cashed_balance to zero if there are no sessions', function () { return __awaiter(void 0, void 0, void 0, function () {
            var project;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(dbUtils_1.insert('project', getFakeProject_1.getFakeProject(client.id, { cashed: fp_ts_1.option.none }), interface_2.ProjectCreationInput), fp_ts_1.taskEither.chain(function (projectId) { return getProjectById(projectId); }), util_1.testTaskEither(function (project) {
                            expect(interface_2.DatabaseProject.encode(project)).toMatchObject({
                                cashed_at: null,
                                cashed_balance: null
                            });
                            return project;
                        }))];
                    case 1:
                        project = _a.sent();
                        return [4, function_1.pipe(dbUtils_1.dbRun(sql_template_strings_1.default(templateObject_4 || (templateObject_4 = __makeTemplateObject(["UPDATE project SET cashed_at = '1990-01-01 00:00:00' WHERE id = ", ""], ["UPDATE project SET cashed_at = '1990-01-01 00:00:00' WHERE id = ", ""])), project.id)), fp_ts_1.taskEither.chain(function () { return getProjectById(project.id); }), util_1.testTaskEither(function (project) {
                                expect(project.cashed).toEqual(fp_ts_1.option.some({
                                    at: new Date(1990, 0, 1),
                                    balance: 0
                                }));
                                expect(interface_2.DatabaseProject.encode(project)).toMatchObject({
                                    cashed_at: new Date(1990, 0, 1).toISOString(),
                                    cashed_balance: 0
                                });
                            }))];
                    case 2:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('Should save SQL dates', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(dbUtils_1.insert('project', getFakeProject_1.getFakeProject(client.id, {
                            cashed: fp_ts_1.option.some({
                                at: new Date(),
                                balance: 42
                            })
                        }), interface_2.ProjectCreationInput), fp_ts_1.taskEither.chain(function (id) {
                            return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_5 || (templateObject_5 = __makeTemplateObject(["SELECT * FROM project WHERE id = ", ""], ["SELECT * FROM project WHERE id = ", ""])), id), t.UnknownRecord);
                        }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), util_1.testTaskEither(function (record) {
                            var sqlDatePattern = /\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/;
                            expect(record.cashed_at).toMatch(sqlDatePattern);
                            expect(record.created_at).toMatch(sqlDatePattern);
                            expect(record.updated_at).toMatch(sqlDatePattern);
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
    });
});
function getProjectById(id) {
    return function_1.pipe(dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n        SELECT project.*, client.user FROM project\n        JOIN client ON client.id = project.client\n        WHERE project.id = ", "\n      "], ["\n        SELECT project.*, client.user FROM project\n        JOIN client ON client.id = project.client\n        WHERE project.id = ", "\n      "])), id), interface_2.DatabaseProject), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
