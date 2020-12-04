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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var init_1 = require("../init");
var resolvers_1 = __importDefault(require("./resolvers"));
var dbUtils_1 = require("../misc/dbUtils");
var getFakeUser_1 = require("../test/getFakeUser");
var getFakeClient_1 = require("../test/getFakeClient");
var getFakeProject_1 = require("../test/getFakeProject");
var getFakeTask_1 = require("../test/getFakeTask");
var function_1 = require("fp-ts/function");
var fp_ts_1 = require("fp-ts");
var registerUser_1 = require("../test/registerUser");
var util_1 = require("../test/util");
var database_1 = require("../client/database");
var database_2 = require("../project/database");
var database_3 = require("../task/database");
var Apply_1 = require("fp-ts/Apply");
var database_4 = require("./database");
var getFakeSession_1 = require("../test/getFakeSession");
describe('session resolvers', function () {
    var user;
    var project;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    process.env.SECRET = 'shhhhh';
                    return [4, function_1.pipe(init_1.init(), fp_ts_1.taskEither.chain(function () { return registerUser_1.registerUser(getFakeUser_1.getFakeUser()); }), util_1.pipeTestTaskEither(function (u) {
                            user = u;
                        }), fp_ts_1.taskEither.chain(function (user) { return database_1.insertClient(getFakeClient_1.getFakeClient(user.id)); }), fp_ts_1.taskEither.chain(function (clientId) { return database_2.insertProject(getFakeProject_1.getFakeProject(clientId)); }), fp_ts_1.taskEither.chain(database_2.getProjectById), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), util_1.pipeTestTaskEither(function (p) {
                            project = p;
                        }), util_1.testTaskEither(function_1.constVoid))];
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
    describe('Task', function () {
        var task;
        beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(database_3.insertTask(getFakeTask_1.getFakeTask(project.id, {
                            expectedWorkingHours: 10,
                            hourlyCost: 50
                        })), fp_ts_1.taskEither.chain(database_3.getTaskById), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), util_1.pipeTestTaskEither(function (t) {
                            task = t;
                        }), util_1.testTaskEither(function_1.constVoid))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(dbUtils_1.remove('task', { project: project.id }), util_1.testTaskEither(function_1.constVoid))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        describe('empty state', function () {
            it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
                var actualWorkingHours, budget, balance;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4, resolvers_1.default.Task.actualWorkingHours(task, {}, { user: user })];
                        case 1:
                            actualWorkingHours = _a.sent();
                            return [4, resolvers_1.default.Task.budget(task, {}, { user: user })];
                        case 2:
                            budget = _a.sent();
                            return [4, resolvers_1.default.Task.balance(task, {}, { user: user })];
                        case 3:
                            balance = _a.sent();
                            expect(actualWorkingHours).toBe(0);
                            expect(budget).toBe(500);
                            expect(balance).toBe(0);
                            return [2];
                    }
                });
            }); });
        });
        describe('with sessions', function () {
            beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4, function_1.pipe(Apply_1.sequenceT(fp_ts_1.taskEither.taskEither)(database_4.insertSession(getFakeSession_1.getFakeSession(task.id, {
                                start_time: new Date('1990-01-01T00:00:00.000Z'),
                                end_time: fp_ts_1.option.some(new Date('1990-01-01T01:00:00.000Z'))
                            })), database_4.insertSession(getFakeSession_1.getFakeSession(task.id, {
                                start_time: new Date('1990-01-01T01:00:00.000Z'),
                                end_time: fp_ts_1.option.some(new Date('1990-01-01T03:00:00.000Z'))
                            })), database_4.insertSession(getFakeSession_1.getFakeSession(task.id, {
                                start_time: new Date('1990-01-01T04:00:00.000Z'),
                                end_time: fp_ts_1.option.some(new Date('1990-01-01T05:30:00.000Z'))
                            }))), util_1.testTaskEither(function_1.constVoid))];
                        case 1:
                            _a.sent();
                            return [2];
                    }
                });
            }); });
            describe('actualWorkingHours', function () {
                it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var actualWorkingHours;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, resolvers_1.default.Task.actualWorkingHours(task, {}, { user: user })];
                            case 1:
                                actualWorkingHours = _a.sent();
                                expect(actualWorkingHours).toBe(4.5);
                                return [2];
                        }
                    });
                }); });
            });
            describe('budget', function () {
                it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var budget;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, resolvers_1.default.Task.budget(task, {}, { user: user })];
                            case 1:
                                budget = _a.sent();
                                expect(budget).toBe(500);
                                return [2];
                        }
                    });
                }); });
            });
            describe('balance', function () {
                it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var balance;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, resolvers_1.default.Task.balance(task, {}, { user: user })];
                            case 1:
                                balance = _a.sent();
                                expect(balance).toBe(225);
                                return [2];
                        }
                    });
                }); });
            });
        });
    });
    describe('Project', function () {
        describe('empty state', function () {
            it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
                var expectedWorkingHours, actualWorkingHours, budget, balance;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4, resolvers_1.default.Project.expectedWorkingHours(project, {}, { user: user })];
                        case 1:
                            expectedWorkingHours = _a.sent();
                            return [4, resolvers_1.default.Project.actualWorkingHours(project, {}, { user: user })];
                        case 2:
                            actualWorkingHours = _a.sent();
                            return [4, resolvers_1.default.Project.budget(project, {}, { user: user })];
                        case 3:
                            budget = _a.sent();
                            return [4, resolvers_1.default.Project.balance(project, {}, { user: user })];
                        case 4:
                            balance = _a.sent();
                            expect(expectedWorkingHours).toBe(0);
                            expect(actualWorkingHours).toBe(0);
                            expect(budget).toBe(0);
                            expect(balance).toBe(0);
                            return [2];
                    }
                });
            }); });
        });
        describe('with tasks', function () {
            beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
                var _a, task1Id, task2Id, task3Id;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                                task1Id: database_3.insertTask(getFakeTask_1.getFakeTask(project.id, {
                                    expectedWorkingHours: 10,
                                    hourlyCost: 25
                                })),
                                task2Id: database_3.insertTask(getFakeTask_1.getFakeTask(project.id, {
                                    expectedWorkingHours: 5,
                                    hourlyCost: 30
                                })),
                                task3Id: database_3.insertTask(getFakeTask_1.getFakeTask(project.id, {
                                    expectedWorkingHours: 20,
                                    hourlyCost: 10
                                }))
                            }), util_1.testTaskEither(function_1.identity))];
                        case 1:
                            _a = _b.sent(), task1Id = _a.task1Id, task2Id = _a.task2Id, task3Id = _a.task3Id;
                            return [4, function_1.pipe(Apply_1.sequenceT(fp_ts_1.taskEither.taskEither)(database_4.insertSession(getFakeSession_1.getFakeSession(task1Id, {
                                    start_time: new Date('1990-01-01T00:00:00Z'),
                                    end_time: fp_ts_1.option.some(new Date('1990-01-01T03:00:00Z'))
                                })), database_4.insertSession(getFakeSession_1.getFakeSession(task1Id, {
                                    start_time: new Date('1990-01-01T03:00:00Z'),
                                    end_time: fp_ts_1.option.some(new Date('1990-01-01T04:30:00Z'))
                                })), database_4.insertSession(getFakeSession_1.getFakeSession(task1Id, {
                                    start_time: new Date('1990-01-01T04:30:00Z'),
                                    end_time: fp_ts_1.option.some(new Date('1990-01-01T06:30:00Z'))
                                })), database_4.insertSession(getFakeSession_1.getFakeSession(task2Id, {
                                    start_time: new Date('1990-01-01T06:30:00Z'),
                                    end_time: fp_ts_1.option.some(new Date('1990-01-01T12:30:00Z'))
                                })), database_4.insertSession(getFakeSession_1.getFakeSession(task2Id, {
                                    start_time: new Date('1990-01-01T12:30:00Z'),
                                    end_time: fp_ts_1.option.some(new Date('1990-01-01T17:30:00Z'))
                                })), database_4.insertSession(getFakeSession_1.getFakeSession(task2Id, {
                                    start_time: new Date('1990-01-01T17:30:00Z'),
                                    end_time: fp_ts_1.option.some(new Date('1990-01-01T18:45:00Z'))
                                })), database_4.insertSession(getFakeSession_1.getFakeSession(task3Id, {
                                    start_time: new Date('1990-01-01T18:45:00Z'),
                                    end_time: fp_ts_1.option.some(new Date('1990-01-01T20:45:00Z'))
                                })), database_4.insertSession(getFakeSession_1.getFakeSession(task3Id, {
                                    start_time: new Date('1990-01-01T20:45:00Z'),
                                    end_time: fp_ts_1.option.some(new Date('1990-01-01T23:45:00Z'))
                                })), database_4.insertSession(getFakeSession_1.getFakeSession(task3Id, {
                                    start_time: new Date('1990-01-01T23:45:00Z'),
                                    end_time: fp_ts_1.option.some(new Date('1990-01-02T00:00:00Z'))
                                }))), util_1.testTaskEither(function_1.constVoid))];
                        case 2:
                            _b.sent();
                            return [2];
                    }
                });
            }); });
            describe('expectedWorkingHours', function () {
                it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var expectedWorkingHours;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, resolvers_1.default.Project.expectedWorkingHours(project, {}, { user: user })];
                            case 1:
                                expectedWorkingHours = _a.sent();
                                expect(expectedWorkingHours).toBe(35);
                                return [2];
                        }
                    });
                }); });
            });
            describe('actualWorkingHours', function () {
                it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var actualWorkingHours;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, resolvers_1.default.Project.actualWorkingHours(project, {}, { user: user })];
                            case 1:
                                actualWorkingHours = _a.sent();
                                expect(actualWorkingHours).toBe(24);
                                return [2];
                        }
                    });
                }); });
            });
            describe('budget', function () {
                it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var budget;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, resolvers_1.default.Project.budget(project, {}, { user: user })];
                            case 1:
                                budget = _a.sent();
                                expect(budget).toBe(600);
                                return [2];
                        }
                    });
                }); });
            });
            describe('balance', function () {
                it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var balance;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, resolvers_1.default.Project.balance(project, {}, { user: user })];
                            case 1:
                                balance = _a.sent();
                                expect(balance).toBe(582.5);
                                return [2];
                        }
                    });
                }); });
            });
        });
    });
    describe('User', function () {
        var user2;
        var since = '1990-01-01T04:30:00.000Z';
        beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(registerUser_1.registerUser(getFakeUser_1.getFakeUser(), user), util_1.pipeTestTaskEither(function (u) {
                            user2 = u;
                        }), util_1.testTaskEither(function_1.constVoid))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        describe('empty state', function () {
            it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
                var expectedWorkingHours, actualWorkingHours, budget, balance;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4, resolvers_1.default.User.expectedWorkingHours(user2, { since: since }, { user: user2 })];
                        case 1:
                            expectedWorkingHours = _a.sent();
                            return [4, resolvers_1.default.User.actualWorkingHours(user2, { since: since }, { user: user2 })];
                        case 2:
                            actualWorkingHours = _a.sent();
                            return [4, resolvers_1.default.User.budget(user2, { since: since }, { user: user2 })];
                        case 3:
                            budget = _a.sent();
                            return [4, resolvers_1.default.User.balance(user2, { since: since }, { user: user2 })];
                        case 4:
                            balance = _a.sent();
                            expect(expectedWorkingHours).toBe(0);
                            expect(actualWorkingHours).toBe(0);
                            expect(budget).toBe(0);
                            expect(balance).toBe(0);
                            return [2];
                    }
                });
            }); });
        });
        describe('with data', function () {
            beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
                var _a, client1Id, client2Id, _b, project1Id, project2Id, _c, task1Id, task2Id, task3Id;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                                client1Id: database_1.insertClient(getFakeClient_1.getFakeClient(user2.id)),
                                client2Id: database_1.insertClient(getFakeClient_1.getFakeClient(user2.id))
                            }), util_1.testTaskEither(function_1.identity))];
                        case 1:
                            _a = _d.sent(), client1Id = _a.client1Id, client2Id = _a.client2Id;
                            return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                                    project1Id: database_2.insertProject(getFakeProject_1.getFakeProject(client1Id, {
                                        cashed: fp_ts_1.option.none
                                    })),
                                    project2Id: database_2.insertProject(getFakeProject_1.getFakeProject(client2Id, {
                                        cashed: fp_ts_1.option.some({
                                            at: new Date(),
                                            balance: 42
                                        })
                                    }))
                                }), util_1.testTaskEither(function_1.identity))];
                        case 2:
                            _b = _d.sent(), project1Id = _b.project1Id, project2Id = _b.project2Id;
                            return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                                    task1Id: database_3.insertTask(getFakeTask_1.getFakeTask(project1Id, {
                                        expectedWorkingHours: 10,
                                        hourlyCost: 25,
                                        start_time: new Date('1990-01-01T00:00:00.000Z')
                                    })),
                                    task2Id: database_3.insertTask(getFakeTask_1.getFakeTask(project1Id, {
                                        expectedWorkingHours: 5,
                                        hourlyCost: 30,
                                        start_time: new Date('1990-01-01T06:30:00.000Z')
                                    })),
                                    task3Id: database_3.insertTask(getFakeTask_1.getFakeTask(project2Id, {
                                        expectedWorkingHours: 20,
                                        hourlyCost: 10,
                                        start_time: new Date('1990-01-01T18:45:00.000Z')
                                    }))
                                }), util_1.testTaskEither(function_1.identity))];
                        case 3:
                            _c = _d.sent(), task1Id = _c.task1Id, task2Id = _c.task2Id, task3Id = _c.task3Id;
                            return [4, function_1.pipe(Apply_1.sequenceT(fp_ts_1.taskEither.taskEither)(database_4.insertSession(getFakeSession_1.getFakeSession(task1Id, {
                                    start_time: new Date('1990-01-01T00:00:00.000Z'),
                                    end_time: fp_ts_1.option.some(new Date('1990-01-01T03:00:00.000Z'))
                                })), database_4.insertSession(getFakeSession_1.getFakeSession(task1Id, {
                                    start_time: new Date('1990-01-01T03:00:00.000Z'),
                                    end_time: fp_ts_1.option.some(new Date('1990-01-01T04:30:00.000Z'))
                                })), database_4.insertSession(getFakeSession_1.getFakeSession(task1Id, {
                                    start_time: new Date('1990-01-01T04:30:00.000Z'),
                                    end_time: fp_ts_1.option.some(new Date('1990-01-01T06:30:00.000Z'))
                                })), database_4.insertSession(getFakeSession_1.getFakeSession(task2Id, {
                                    start_time: new Date('1990-01-01T06:30:00.000Z'),
                                    end_time: fp_ts_1.option.some(new Date('1990-01-01T12:30:00.000Z'))
                                })), database_4.insertSession(getFakeSession_1.getFakeSession(task2Id, {
                                    start_time: new Date('1990-01-01T12:30:00.000Z'),
                                    end_time: fp_ts_1.option.some(new Date('1990-01-01T17:30:00.000Z'))
                                })), database_4.insertSession(getFakeSession_1.getFakeSession(task2Id, {
                                    start_time: new Date('1990-01-01T17:30:00.000Z'),
                                    end_time: fp_ts_1.option.some(new Date('1990-01-01T18:45:00.000Z'))
                                })), database_4.insertSession(getFakeSession_1.getFakeSession(task3Id, {
                                    start_time: new Date('1990-01-01T18:45:00.000Z'),
                                    end_time: fp_ts_1.option.some(new Date('1990-01-01T20:45:00.000Z'))
                                })), database_4.insertSession(getFakeSession_1.getFakeSession(task3Id, {
                                    start_time: new Date('1990-01-01T20:45:00.000Z'),
                                    end_time: fp_ts_1.option.some(new Date('1990-01-01T23:45:00.000Z'))
                                })), database_4.insertSession(getFakeSession_1.getFakeSession(task3Id, {
                                    start_time: new Date('1990-01-01T23:45:00.000Z'),
                                    end_time: fp_ts_1.option.some(new Date('1990-01-02T00:00:00.000Z'))
                                }))), util_1.testTaskEither(function_1.constVoid))];
                        case 4:
                            _d.sent();
                            return [2];
                    }
                });
            }); });
            describe('expectedWorkingHours', function () {
                it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var expectedWorkingHours;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, resolvers_1.default.User.expectedWorkingHours(user2, { since: since }, { user: user2 })];
                            case 1:
                                expectedWorkingHours = _a.sent();
                                expect(expectedWorkingHours).toBe(5);
                                return [2];
                        }
                    });
                }); });
            });
            describe('actualWorkingHours', function () {
                it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var actualWorkingHours;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, resolvers_1.default.User.actualWorkingHours(user2, { since: since }, { user: user2 })];
                            case 1:
                                actualWorkingHours = _a.sent();
                                expect(actualWorkingHours).toBe(14.25);
                                return [2];
                        }
                    });
                }); });
            });
            describe('budget', function () {
                it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var budget;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, resolvers_1.default.User.budget(user2, { since: since }, { user: user2 })];
                            case 1:
                                budget = _a.sent();
                                expect(budget).toBe(150);
                                return [2];
                        }
                    });
                }); });
            });
            describe('balance', function () {
                it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var balance;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, resolvers_1.default.User.balance(user2, { since: since }, { user: user2 })];
                            case 1:
                                balance = _a.sent();
                                expect(balance).toBe(417.5);
                                return [2];
                        }
                    });
                }); });
            });
        });
    });
});
