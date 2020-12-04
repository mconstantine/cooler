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
var dbUtils_1 = require("../misc/dbUtils");
var getFakeUser_1 = require("../test/getFakeUser");
var getFakeClient_1 = require("../test/getFakeClient");
var getFakeProject_1 = require("../test/getFakeProject");
var getFakeTask_1 = require("../test/getFakeTask");
var getFakeSession_1 = require("../test/getFakeSession");
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var model_1 = require("./model");
var init_1 = require("../init");
var getConnectionNodes_1 = require("../test/getConnectionNodes");
var interface_1 = require("./interface");
var fp_ts_1 = require("fp-ts");
var registerUser_1 = require("../test/registerUser");
var util_1 = require("../test/util");
var function_1 = require("fp-ts/function");
var Apply_1 = require("fp-ts/Apply");
var database_1 = require("../client/database");
var database_2 = require("../project/database");
var database_3 = require("../task/database");
var database_4 = require("./database");
var user1;
var user2;
var task1;
var task2;
var session1;
var session2;
beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, client1Id, client2Id, _b, project1Id, project2Id;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                process.env.SECRET = 'shhhhh';
                return [4, function_1.pipe(init_1.init(), fp_ts_1.taskEither.chain(function () { return registerUser_1.registerUser(getFakeUser_1.getFakeUser()); }), util_1.pipeTestTaskEither(function (u) {
                        user1 = u;
                    }), util_1.testTaskEither(function_1.constVoid))];
            case 1:
                _c.sent();
                return [4, function_1.pipe(registerUser_1.registerUser(getFakeUser_1.getFakeUser(), user1), util_1.pipeTestTaskEither(function (u) {
                        user2 = u;
                    }), util_1.testTaskEither(function_1.constVoid))];
            case 2:
                _c.sent();
                return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                        client1Id: database_1.insertClient(getFakeClient_1.getFakeClient(user1.id)),
                        client2Id: database_1.insertClient(getFakeClient_1.getFakeClient(user2.id))
                    }), util_1.testTaskEither(function_1.identity))];
            case 3:
                _a = _c.sent(), client1Id = _a.client1Id, client2Id = _a.client2Id;
                return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                        project1Id: database_2.insertProject(getFakeProject_1.getFakeProject(client1Id)),
                        project2Id: database_2.insertProject(getFakeProject_1.getFakeProject(client2Id))
                    }), util_1.testTaskEither(function_1.identity))];
            case 4:
                _b = _c.sent(), project1Id = _b.project1Id, project2Id = _b.project2Id;
                return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                        t1: function_1.pipe(database_3.insertTask(getFakeTask_1.getFakeTask(project1Id)), fp_ts_1.taskEither.chain(function (id) { return database_3.getTaskById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError))),
                        t2: function_1.pipe(database_3.insertTask(getFakeTask_1.getFakeTask(project2Id)), fp_ts_1.taskEither.chain(function (id) { return database_3.getTaskById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)))
                    }), util_1.pipeTestTaskEither(function (_a) {
                        var t1 = _a.t1, t2 = _a.t2;
                        task1 = t1;
                        task2 = t2;
                    }), util_1.testTaskEither(function_1.constVoid))];
            case 5:
                _c.sent();
                return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                        s1: function_1.pipe(database_4.insertSession(getFakeSession_1.getFakeSession(task1.id)), fp_ts_1.taskEither.chain(function (id) { return database_4.getSessionById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError))),
                        s2: function_1.pipe(database_4.insertSession(getFakeSession_1.getFakeSession(task2.id)), fp_ts_1.taskEither.chain(function (id) { return database_4.getSessionById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)))
                    }), util_1.pipeTestTaskEither(function (_a) {
                        var s1 = _a.s1, s2 = _a.s2;
                        session1 = s1;
                        session2 = s2;
                    }), util_1.testTaskEither(function_1.constVoid))];
            case 6:
                _c.sent();
                return [2];
        }
    });
}); });
describe('startSession', function () {
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(dbUtils_1.dbRun(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n        DELETE FROM session\n        WHERE id != ", " AND id != ", "\n      "], ["\n        DELETE FROM session\n        WHERE id != ", " AND id != ", "\n      "])), session1.id, session2.id)), util_1.testTaskEither(function_1.constVoid))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.startSession(task1.id, user1), util_1.testTaskEither(function (session) {
                        expect(interface_1.Session.is(session)).toBe(true);
                        expect(session.start_time).toBeInstanceOf(Date);
                        expect(fp_ts_1.option.isNone(session.end_time)).toBe(true);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it("should not allow users to create sessions for other users' tasks", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.startSession(task2.id, user1), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should not allow to open more than one session per task', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.startSession(task1.id, user1), util_1.pipeTestTaskEither(function_1.constVoid), fp_ts_1.taskEither.chain(function () { return model_1.startSession(task1.id, user1); }), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_409');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('stopSession', function () {
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.startSession(task1.id, user1), util_1.pipeTestTaskEither(function (session) {
                        expect(fp_ts_1.option.isNone(session.end_time)).toBe(true);
                    }), fp_ts_1.taskEither.chain(function (session) { return model_1.stopSession(session.id, user1); }), util_1.testTaskEither(function (session) {
                        expect(interface_1.Session.is(session)).toBe(true);
                        expect(fp_ts_1.option.isSome(session.end_time)).toBe(true);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('getSession', function () {
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.getSession(session1.id, user1), util_1.testTaskEither(function (session) {
                        expect(session).toMatchObject(session1);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it("should not allow users to see other users' sessions", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.getSession(session2.id, user1), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('listSessions', function () {
    it("should list only the user's sessions", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.listSessions({ task: fp_ts_1.option.none }, user1), util_1.testTaskEither(function (connection) {
                        var sessions = getConnectionNodes_1.getConnectionNodes(connection);
                        expect(sessions).toContainEqual(expect.objectContaining({ id: session1.id }));
                        expect(sessions).not.toContainEqual(expect.objectContaining({ id: session2.id }));
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('updateSession', function () {
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = getFakeSession_1.getFakeSession(task2.id);
                    return [4, function_1.pipe(model_1.updateSession(session2.id, data, user2), util_1.pipeTestTaskEither(function (session) {
                            expect(session).toMatchObject(data);
                        }), fp_ts_1.taskEither.chain(function (session) { return database_4.getSessionById(session.id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), util_1.pipeTestTaskEither(function (session) {
                            session2 = session;
                        }), util_1.testTaskEither(function_1.constVoid))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it("should not allow users to update other users' sessions", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.updateSession(session1.id, getFakeSession_1.getFakeSession(task1.id), user2), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it("should not allow users to assign to their sessions other users' tasks", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.updateSession(session1.id, getFakeSession_1.getFakeSession(task2.id), user1), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should not allow to reopen a session', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.updateSession(session2.id, { end_time: fp_ts_1.option.some(new Date()) }, user2), util_1.pipeTestTaskEither(function_1.constVoid), fp_ts_1.taskEither.chain(function () {
                        return model_1.updateSession(session2.id, { end_time: fp_ts_1.option.none }, user2);
                    }), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_409');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('deleteSession', function () {
    var session1;
    var session2;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                        s1: model_1.startSession(task1.id, user1),
                        s2: model_1.startSession(task2.id, user2)
                    }), util_1.pipeTestTaskEither(function (_a) {
                        var s1 = _a.s1, s2 = _a.s2;
                        session1 = s1;
                        session2 = s2;
                    }), util_1.testTaskEither(function_1.constVoid))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, Apply_1.sequenceT(fp_ts_1.taskEither.taskEither)(model_1.stopSession(session1.id, user1), model_1.stopSession(session2.id, user2))()];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.deleteSession(session1.id, user1), util_1.testTaskEither(function (session) {
                        expect(interface_1.Session.is(session)).toBe(true);
                        expect(session).toMatchObject(session1);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it("should not allow users to delete other users' sessions", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.deleteSession(session2.id, user1), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
var templateObject_1;
