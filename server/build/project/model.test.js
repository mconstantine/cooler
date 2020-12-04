"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var interface_1 = require("./interface");
var init_1 = require("../init");
var function_1 = require("fp-ts/function");
var util_1 = require("../test/util");
var registerUser_1 = require("../test/registerUser");
var getFakeUser_1 = require("../test/getFakeUser");
var Apply_1 = require("fp-ts/Apply");
var fp_ts_1 = require("fp-ts");
var getFakeClient_1 = require("../test/getFakeClient");
var database_1 = require("../client/database");
var database_2 = require("./database");
var getFakeProject_1 = require("../test/getFakeProject");
var database_3 = require("../user/database");
var model_1 = require("./model");
var getConnectionNodes_1 = require("../test/getConnectionNodes");
var user1;
var user2;
var client1;
var client2;
var project1;
var project2;
beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                process.env.SECRET = 'shhhhh';
                return [4, function_1.pipe(init_1.init(), util_1.testTaskEither(function_1.constVoid))];
            case 1:
                _a.sent();
                return [4, function_1.pipe(registerUser_1.registerUser(getFakeUser_1.getFakeUser()), util_1.testTaskEither(function (user) {
                        user1 = user;
                    }))];
            case 2:
                _a.sent();
                return [4, function_1.pipe(registerUser_1.registerUser(getFakeUser_1.getFakeUser(), user1), util_1.testTaskEither(function (user) {
                        user2 = user;
                    }))];
            case 3:
                _a.sent();
                return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                        c1: function_1.pipe(database_1.insertClient(getFakeClient_1.getFakeClient(user1.id)), fp_ts_1.taskEither.chain(function (id) { return database_1.getClientById(id); })),
                        c2: function_1.pipe(database_1.insertClient(getFakeClient_1.getFakeClient(user2.id)), fp_ts_1.taskEither.chain(function (id) { return database_1.getClientById(id); }))
                    }), fp_ts_1.taskEither.map(function (_a) {
                        var c1 = _a.c1, c2 = _a.c2;
                        return Apply_1.sequenceS(fp_ts_1.option.option)({ c1: c1, c2: c2 });
                    }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), util_1.testTaskEither(function (_a) {
                        var c1 = _a.c1, c2 = _a.c2;
                        client1 = c1;
                        client2 = c2;
                    }))];
            case 4:
                _a.sent();
                return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                        p1: function_1.pipe(database_2.insertProject(getFakeProject_1.getFakeProject(client1.id)), fp_ts_1.taskEither.chain(function (id) { return database_2.getProjectById(id); })),
                        p2: function_1.pipe(database_2.insertProject(getFakeProject_1.getFakeProject(client2.id)), fp_ts_1.taskEither.chain(function (id) { return database_2.getProjectById(id); }))
                    }), fp_ts_1.taskEither.map(function (_a) {
                        var p1 = _a.p1, p2 = _a.p2;
                        return Apply_1.sequenceS(fp_ts_1.option.option)({ p1: p1, p2: p2 });
                    }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), util_1.testTaskEither(function (_a) {
                        var p1 = _a.p1, p2 = _a.p2;
                        project1 = p1;
                        project2 = p2;
                    }))];
            case 5:
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
                return [4, function_1.pipe(database_3.deleteUser(user1.id), fp_ts_1.taskEither.chain(function () { return database_3.deleteUser(user2.id); }), util_1.testTaskEither(function_1.constVoid))];
            case 1:
                _a.sent();
                return [2];
        }
    });
}); });
describe('createProject', function () {
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.createProject(getFakeProject_1.getFakeProject(client1.id), user1), util_1.testTaskEither(function (project) {
                        expect(interface_1.Project.is(project)).toBe(true);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it("should not allow users to create projects for other users' clients", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.createProject(getFakeProject_1.getFakeProject(client2.id), user1), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('getProject', function () {
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.getProject(project1.id, user1), util_1.testTaskEither(function (project) {
                        expect(interface_1.Project.is(project)).toBe(true);
                        expect(project).toMatchObject(project1);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it("should not allow users to see other users' projects", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.getProject(project2.id, user1), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('listProjects', function () {
    it("should list only the user's projects", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.listProjects({ name: fp_ts_1.option.none }, user1), util_1.testTaskEither(function (connection) {
                        var projects = getConnectionNodes_1.getConnectionNodes(connection);
                        expect(projects).toContainEqual(expect.objectContaining({ id: project1.id }));
                        expect(projects).not.toContainEqual(expect.objectContaining({ id: project2.id }));
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('updateProject', function () {
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = getFakeProject_1.getFakeProject(client1.id);
                    return [4, function_1.pipe(model_1.updateProject(project1.id, data, user1), util_1.testTaskEither(function (project) {
                            expect(interface_1.Project.is(project)).toBe(true);
                            expect(project).toMatchObject(data);
                            project1 = project;
                        }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it("should not allow users to update other users' projects", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.updateProject(project1.id, getFakeProject_1.getFakeProject(client1.id), user2), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it("should not allow users to assign to their projects other users' clients", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.updateProject(project1.id, getFakeProject_1.getFakeProject(client2.id), user1), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('deleteProject', function () {
    var project1;
    var project2;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                        p1: model_1.createProject(getFakeProject_1.getFakeProject(client1.id), user1),
                        p2: model_1.createProject(getFakeProject_1.getFakeProject(client2.id), user2)
                    }), util_1.testTaskEither(function (_a) {
                        var p1 = _a.p1, p2 = _a.p2;
                        project1 = p1;
                        project2 = p2;
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.deleteProject(project1.id, user1), util_1.testTaskEither(function (project) {
                        expect(project).toMatchObject(project1);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it("should not allow users to delete other users' projects", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.deleteProject(project2.id, user1), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
