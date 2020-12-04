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
var getFakeUser_1 = require("../test/getFakeUser");
var registerUser_1 = require("../test/registerUser");
var util_1 = require("../test/util");
var init_1 = require("../init");
var interface_1 = require("./interface");
var dbUtils_1 = require("../misc/dbUtils");
var database_1 = require("../client/database");
var getFakeClient_1 = require("../test/getFakeClient");
var database_2 = require("../project/database");
var getFakeProject_1 = require("../test/getFakeProject");
var database_3 = require("./database");
var getFakeTask_1 = require("../test/getFakeTask");
var model_1 = require("./model");
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var getConnectionNodes_1 = require("../test/getConnectionNodes");
var user1;
var user2;
var client1;
var client2;
var project1;
var project2;
var task1;
var task2;
beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                process.env.SECRET = 'shhhhh';
                return [4, function_1.pipe(init_1.init(), fp_ts_1.taskEither.chain(function () { return registerUser_1.registerUser(getFakeUser_1.getFakeUser()); }), util_1.testTaskEither(function (u) {
                        user1 = u;
                    }))];
            case 1:
                _a.sent();
                return [4, function_1.pipe(registerUser_1.registerUser(getFakeUser_1.getFakeUser(), user1), util_1.testTaskEither(function (u) {
                        user2 = u;
                    }))];
            case 2:
                _a.sent();
                return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                        c1: function_1.pipe(database_1.insertClient(getFakeClient_1.getFakeClient(user1.id)), fp_ts_1.taskEither.chain(function (id) { return database_1.getClientById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError))),
                        c2: function_1.pipe(database_1.insertClient(getFakeClient_1.getFakeClient(user2.id)), fp_ts_1.taskEither.chain(function (id) { return database_1.getClientById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)))
                    }), util_1.testTaskEither(function (_a) {
                        var c1 = _a.c1, c2 = _a.c2;
                        client1 = c1;
                        client2 = c2;
                    }))];
            case 3:
                _a.sent();
                return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                        p1: function_1.pipe(database_2.insertProject(getFakeProject_1.getFakeProject(client1.id)), fp_ts_1.taskEither.chain(function (id) { return database_2.getProjectById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError))),
                        p2: function_1.pipe(database_2.insertProject(getFakeProject_1.getFakeProject(client2.id)), fp_ts_1.taskEither.chain(function (id) { return database_2.getProjectById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)))
                    }), util_1.testTaskEither(function (_a) {
                        var p1 = _a.p1, p2 = _a.p2;
                        project1 = p1;
                        project2 = p2;
                    }))];
            case 4:
                _a.sent();
                return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                        t1: function_1.pipe(database_3.insertTask(getFakeTask_1.getFakeTask(project1.id)), fp_ts_1.taskEither.chain(function (id) { return database_3.getTaskById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError))),
                        t2: function_1.pipe(database_3.insertTask(getFakeTask_1.getFakeTask(project2.id)), fp_ts_1.taskEither.chain(function (id) { return database_3.getTaskById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)))
                    }), util_1.testTaskEither(function (_a) {
                        var t1 = _a.t1, t2 = _a.t2;
                        task1 = t1;
                        task2 = t2;
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
                return [4, function_1.pipe(dbUtils_1.remove('user'), util_1.testTaskEither(function_1.constVoid))];
            case 1:
                _a.sent();
                return [2];
        }
    });
}); });
describe('getTodayTasks', function () {
    var task1;
    var task2;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                        t1: function_1.pipe(database_3.insertTask(getFakeTask_1.getFakeTask(project1.id, { start_time: new Date() })), fp_ts_1.taskEither.chain(function (id) { return database_3.getTaskById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError))),
                        t2: function_1.pipe(database_3.insertTask(getFakeTask_1.getFakeTask(project1.id, {
                            start_time: new Date(Date.now() + 86400000)
                        })), fp_ts_1.taskEither.chain(function (id) { return database_3.getTaskById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)))
                    }), util_1.testTaskEither(function (_a) {
                        var t1 = _a.t1, t2 = _a.t2;
                        task1 = t1;
                        task2 = t2;
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                        task1: dbUtils_1.remove('task', { id: task1.id }),
                        task2: dbUtils_1.remove('task', { id: task2.id })
                    }), util_1.testTaskEither(function_1.constVoid))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        var now;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = new Date();
                    return [4, function_1.pipe(model_1.getUserTasks(user1, {
                            from: fp_ts_1.option.some(new Date(now.getFullYear(), now.getMonth(), now.getDate())),
                            to: fp_ts_1.option.some(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))
                        }), util_1.testTaskEither(function (connection) {
                            var tasks = getConnectionNodes_1.getConnectionNodes(connection);
                            expect(tasks).toContainEqual(expect.objectContaining({
                                id: task1.id
                            }));
                            expect(tasks).not.toContainEqual(expect.objectContaining({
                                id: task2.id
                            }));
                        }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('createTask', function () {
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.createTask(getFakeTask_1.getFakeTask(project1.id), user1), util_1.testTaskEither(function (task) {
                        expect(interface_1.Task.is(task)).toBe(true);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it("should not allow users to create tasks for other users' projects", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.createTask(getFakeTask_1.getFakeTask(project2.id), user1), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('createTasksBatch', function () {
    var project;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(database_2.insertProject(getFakeProject_1.getFakeProject(client1.id)), util_1.testTaskEither(function (id) {
                        project = id;
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(dbUtils_1.remove('task', { project: project }), util_1.testTaskEither(function_1.constVoid))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(dbUtils_1.remove('project', { id: project }), util_1.testTaskEither(function_1.constVoid))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should copy expected working hours, hourly cost and start time', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.createTasksBatch({
                        name: 'Task #',
                        expectedWorkingHours: 8,
                        hourlyCost: 1,
                        project: project,
                        start_time: new Date(1990, 0, 1, 10, 42),
                        from: new Date(1990, 0, 1, 10, 0),
                        to: new Date(1990, 0, 5, 10, 0),
                        repeat: 0x1111111
                    }, user1), fp_ts_1.taskEither.chain(function () {
                        return dbUtils_1.dbGetAll(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n            SELECT task.*, client.user\n            FROM task\n            JOIN project ON task.project = project.id\n            JOIN client ON project.client = client.id\n            WHERE task.project = ", "\n          "], ["\n            SELECT task.*, client.user\n            FROM task\n            JOIN project ON task.project = project.id\n            JOIN client ON project.client = client.id\n            WHERE task.project = ", "\n          "])), project), interface_1.DatabaseTask);
                    }), util_1.testTaskEither(function (tasks) {
                        expect(tasks.length).toBe(5);
                        tasks.forEach(function (task) {
                            expect(task.expectedWorkingHours).toBe(8);
                            expect(task.hourlyCost).toBe(1);
                            expect(task.start_time.getHours()).toBe(10);
                            expect(task.start_time.getMinutes()).toBe(42);
                        });
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should format dates correctly', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.createTasksBatch({
                        name: 'D-DD-DDD-DDDD, M/MM/MMM/MMMM, YY / YYYY ADAMY',
                        start_time: new Date(1990, 0, 1, 10, 42),
                        from: new Date(1990, 0, 1, 10, 0),
                        to: new Date(1990, 0, 1, 10, 0),
                        expectedWorkingHours: 8,
                        hourlyCost: 1,
                        project: project,
                        repeat: 0x1111111
                    }, user1), fp_ts_1.taskEither.chain(function () {
                        return dbUtils_1.dbGetAll(sql_template_strings_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n            SELECT task.*, client.user\n            FROM task\n            JOIN project ON task.project = project.id\n            JOIN client ON project.client = client.id\n            WHERE task.project = ", "\n          "], ["\n            SELECT task.*, client.user\n            FROM task\n            JOIN project ON task.project = project.id\n            JOIN client ON project.client = client.id\n            WHERE task.project = ", "\n          "])), project), interface_1.DatabaseTask);
                    }), util_1.testTaskEither(function (tasks) {
                        expect(tasks.length).toBe(1);
                        expect(tasks[0].name).toBe('1-01-Mon-Monday, 1/01/Jan/January, 90 / 1990 ADAMY');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should format indexes correctly', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.createTasksBatch({
                        name: 'Task #',
                        start_time: new Date(1990, 0, 1, 10, 42),
                        from: new Date(1990, 0, 1, 10, 0),
                        to: new Date(1990, 0, 5, 10, 0),
                        expectedWorkingHours: 8,
                        hourlyCost: 1,
                        project: project,
                        repeat: 0x1111111
                    }, user1), fp_ts_1.taskEither.chain(function () {
                        return dbUtils_1.dbGetAll(sql_template_strings_1.default(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n            SELECT task.*, client.user\n            FROM task\n            JOIN project ON task.project = project.id\n            JOIN client ON project.client = client.id\n            WHERE task.project = ", "\n          "], ["\n            SELECT task.*, client.user\n            FROM task\n            JOIN project ON task.project = project.id\n            JOIN client ON project.client = client.id\n            WHERE task.project = ", "\n          "])), project), interface_1.DatabaseTask);
                    }), util_1.testTaskEither(function (tasks) {
                        expect(tasks.length).toBe(5);
                        expect(tasks[0].name).toBe('Task 1');
                        expect(tasks[1].name).toBe('Task 2');
                        expect(tasks[2].name).toBe('Task 3');
                        expect(tasks[3].name).toBe('Task 4');
                        expect(tasks[4].name).toBe('Task 5');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should understand repeat with bit masks', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.createTasksBatch({
                        name: 'Task #',
                        start_time: new Date(1990, 0, 1, 10, 42),
                        from: new Date(1990, 0, 1, 10, 0),
                        to: new Date(1990, 0, 7, 10, 0),
                        expectedWorkingHours: 8,
                        hourlyCost: 1,
                        project: project,
                        repeat: 0x0111010
                    }, user1), fp_ts_1.taskEither.chain(function () {
                        return dbUtils_1.dbGetAll(sql_template_strings_1.default(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n            SELECT task.*, client.user\n            FROM task\n            JOIN project ON task.project = project.id\n            JOIN client ON project.client = client.id\n            WHERE task.project = ", "\n          "], ["\n            SELECT task.*, client.user\n            FROM task\n            JOIN project ON task.project = project.id\n            JOIN client ON project.client = client.id\n            WHERE task.project = ", "\n          "])), project), interface_1.DatabaseTask);
                    }), util_1.testTaskEither(function (tasks) {
                        expect(tasks.length).toBe(4);
                        expect(tasks).toContainEqual(expect.objectContaining({
                            start_time: new Date(1990, 0, 1, 10, 42)
                        }));
                        expect(tasks).toContainEqual(expect.objectContaining({
                            start_time: new Date(1990, 0, 3, 10, 42)
                        }));
                        expect(tasks).toContainEqual(expect.objectContaining({
                            start_time: new Date(1990, 0, 4, 10, 42)
                        }));
                        expect(tasks).toContainEqual(expect.objectContaining({
                            start_time: new Date(1990, 0, 5, 10, 42)
                        }));
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should skip existing tasks', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(database_3.insertTask(getFakeTask_1.getFakeTask(project, {
                        start_time: new Date(1990, 0, 3, 10, 42)
                    })), fp_ts_1.taskEither.chain(function () {
                        return model_1.createTasksBatch({
                            name: 'Task #',
                            start_time: new Date(1990, 0, 1, 10, 42),
                            from: new Date(1990, 0, 1, 10, 0),
                            to: new Date(1990, 0, 7, 10, 0),
                            expectedWorkingHours: 8,
                            hourlyCost: 1,
                            project: project,
                            repeat: 0x0111010
                        }, user1);
                    }), fp_ts_1.taskEither.chain(function () {
                        return dbUtils_1.dbGetAll(sql_template_strings_1.default(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n            SELECT task.*, client.user\n            FROM task\n            JOIN project ON task.project = project.id\n            JOIN client ON project.client = client.id\n            WHERE task.project = ", "\n          "], ["\n            SELECT task.*, client.user\n            FROM task\n            JOIN project ON task.project = project.id\n            JOIN client ON project.client = client.id\n            WHERE task.project = ", "\n          "])), project), interface_1.DatabaseTask);
                    }), util_1.testTaskEither(function (tasks) {
                        expect(tasks.length).toBe(4);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('getTask', function () {
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.getTask(task1.id, user1), util_1.testTaskEither(function (task) {
                        expect(task).toMatchObject(task1);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it("should not allow users to see other users' tasks", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.getTask(task2.id, user1), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('listTasks', function () {
    it("should list only the user's tasks", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.listTasks({ name: fp_ts_1.option.none }, user1), util_1.testTaskEither(function (connection) {
                        var tasks = getConnectionNodes_1.getConnectionNodes(connection);
                        expect(tasks).toContainEqual(expect.objectContaining({ id: task1.id }));
                        expect(tasks).not.toContainEqual(expect.objectContaining({ id: task2.id }));
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('updateTask', function () {
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            data = getFakeTask_1.getFakeTask(project1.id);
            return [2, function_1.pipe(model_1.updateTask(task1.id, data, user1), util_1.testTaskEither(function (task) {
                    expect(interface_1.Task.is(task)).toBe(true);
                    task1 = task;
                }))];
        });
    }); });
    it("should not allow users to update other users' tasks", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.updateTask(task1.id, getFakeTask_1.getFakeTask(project1.id), user2), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it("should not allow users to assign to their tasks other users' projects", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.updateTask(task1.id, getFakeTask_1.getFakeTask(project2.id), user1), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('deleteTask', function () {
    var task1;
    var task2;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                        t1: model_1.createTask(getFakeTask_1.getFakeTask(project1.id), user1),
                        t2: model_1.createTask(getFakeTask_1.getFakeTask(project2.id), user2)
                    }), util_1.testTaskEither(function (_a) {
                        var t1 = _a.t1, t2 = _a.t2;
                        task1 = t1;
                        task2 = t2;
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
                case 0: return [4, function_1.pipe(model_1.deleteTask(task1.id, user1), util_1.testTaskEither(function (task) {
                        expect(task).toMatchObject(task1);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it("should not allow users to delete other users' tasks", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.deleteTask(task2.id, user1), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
