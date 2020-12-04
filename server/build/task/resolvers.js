"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksConnectionQueryArgs = exports.UserTasksConnectionQueryArgs = void 0;
var interface_1 = require("./interface");
var interface_2 = require("../project/interface");
var model_1 = require("./model");
var ConnectionQueryArgs_1 = require("../misc/ConnectionQueryArgs");
var ensureUser_1 = require("../misc/ensureUser");
var Connection_1 = require("../misc/Connection");
var createResolver_1 = require("../misc/createResolver");
var t = __importStar(require("io-ts"));
var io_ts_types_1 = require("io-ts-types");
var function_1 = require("fp-ts/function");
var fp_ts_1 = require("fp-ts");
var Types_1 = require("../misc/Types");
var taskProjectResolver = createResolver_1.createResolver(t.void, interface_2.Project, model_1.getTaskProject);
exports.UserTasksConnectionQueryArgs = t.intersection([
    ConnectionQueryArgs_1.ConnectionQueryArgs,
    t.type({
        from: io_ts_types_1.optionFromNullable(io_ts_types_1.DateFromISOString),
        to: io_ts_types_1.optionFromNullable(io_ts_types_1.DateFromISOString)
    })
], 'UserTasksConnectionQueryArgs');
var userTasksResolver = createResolver_1.createResolver(exports.UserTasksConnectionQueryArgs, Connection_1.Connection(interface_1.Task), model_1.getUserTasks);
var projectTasksResolver = createResolver_1.createResolver(ConnectionQueryArgs_1.ConnectionQueryArgs, Connection_1.Connection(interface_1.Task), model_1.getProjectTasks);
var CreateTaskMutationInput = t.type({
    task: interface_1.TaskCreationInput
}, 'CreateTaskMutationInput');
var createTaskMutation = createResolver_1.createResolver(CreateTaskMutationInput, interface_1.Task, function (_parent, _a, context) {
    var task = _a.task;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.createTask(task, user); }));
});
var CreateTasksBatchMutationInput = t.type({
    input: interface_1.TasksBatchCreationInput
}, 'CreateTasksBatchMutationInput');
var createTasksBatchMutation = createResolver_1.createResolver(CreateTasksBatchMutationInput, interface_2.Project, function (_parent, _a, context) {
    var input = _a.input;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.createTasksBatch(input, user); }));
});
var UpdateTaskMutationInput = t.type({
    id: Types_1.PositiveInteger,
    task: interface_1.TaskUpdateInput
}, 'UpdateTaskMutationInput');
var updateTaskMutation = createResolver_1.createResolver(UpdateTaskMutationInput, interface_1.Task, function (_parent, _a, context) {
    var id = _a.id, task = _a.task;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.updateTask(id, task, user); }));
});
var DeleteTaskMutationInput = t.type({
    id: Types_1.PositiveInteger
}, 'DeleteTaskMutationInput');
var deleteTaskMutation = createResolver_1.createResolver(DeleteTaskMutationInput, interface_1.Task, function (_parent, _a, context) {
    var id = _a.id;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.deleteTask(id, user); }));
});
var TaskQueryInput = t.type({
    id: Types_1.PositiveInteger
}, 'TaskQueryInput');
var taskQuery = createResolver_1.createResolver(TaskQueryInput, interface_1.Task, function (_parent, _a, context) {
    var id = _a.id;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.getTask(id, user); }));
});
exports.TasksConnectionQueryArgs = t.intersection([
    ConnectionQueryArgs_1.ConnectionQueryArgs,
    t.type({
        name: io_ts_types_1.optionFromNullable(io_ts_types_1.NonEmptyString)
    })
], 'TasksConnectionQueryArgs');
var tasksQuery = createResolver_1.createResolver(exports.TasksConnectionQueryArgs, Connection_1.Connection(interface_1.Task), function (_parent, args, context) {
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.listTasks(args, user); }));
});
var resolvers = {
    Task: {
        project: taskProjectResolver
    },
    User: {
        tasks: userTasksResolver
    },
    Project: {
        tasks: projectTasksResolver
    },
    Mutation: {
        createTask: createTaskMutation,
        createTasksBatch: createTasksBatchMutation,
        updateTask: updateTaskMutation,
        deleteTask: deleteTaskMutation
    },
    Query: {
        task: taskQuery,
        tasks: tasksQuery
    }
};
exports.default = resolvers;
