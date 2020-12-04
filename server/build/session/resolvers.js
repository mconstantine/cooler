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
exports.UserDataFromSessionResolverInput = void 0;
var interface_1 = require("./interface");
var ConnectionQueryArgs_1 = require("../misc/ConnectionQueryArgs");
var interface_2 = require("../task/interface");
var ensureUser_1 = require("../misc/ensureUser");
var model_1 = require("./model");
var Connection_1 = require("../misc/Connection");
var t = __importStar(require("io-ts"));
var io_ts_types_1 = require("io-ts-types");
var createResolver_1 = require("../misc/createResolver");
var Types_1 = require("../misc/Types");
var function_1 = require("fp-ts/function");
var fp_ts_1 = require("fp-ts");
exports.UserDataFromSessionResolverInput = t.type({
    since: io_ts_types_1.optionFromNullable(io_ts_types_1.DateFromISOString)
}, 'UserDataFromSessionResolverInput');
var sessionTaskResolver = createResolver_1.createResolver(Types_1.EmptyObject, interface_2.Task, model_1.getSessionTask);
var taskSessionsResolver = createResolver_1.createResolver(ConnectionQueryArgs_1.ConnectionQueryArgs, Connection_1.Connection(interface_1.Session), function (task, args, context) {
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.getTaskSessions(task, args, user); }));
});
var taskActualWorkingHoursResolver = createResolver_1.createResolver(Types_1.EmptyObject, t.number, model_1.getTaskActualWorkingHours);
var taskBudgetResolver = createResolver_1.createResolver(Types_1.EmptyObject, t.number, model_1.getTaskBudget);
var taskBalanceResolver = createResolver_1.createResolver(Types_1.EmptyObject, t.number, model_1.getTaskBalance);
var projectExpectedWorkingHoursResolver = createResolver_1.createResolver(Types_1.EmptyObject, t.number, model_1.getProjectExpectedWorkingHours);
var projectActualWorkingHoursResolver = createResolver_1.createResolver(Types_1.EmptyObject, t.number, model_1.getProjectActualWorkingHours);
var projectBudgetResolver = createResolver_1.createResolver(Types_1.EmptyObject, t.number, model_1.getProjectBudget);
var projectBalanceResolver = createResolver_1.createResolver(Types_1.EmptyObject, t.number, model_1.getProjectBalance);
var userOpenSessionsResolver = createResolver_1.createResolver(ConnectionQueryArgs_1.ConnectionQueryArgs, Connection_1.Connection(interface_1.Session), model_1.getUserOpenSessions);
var userExpectedWorkingHoursResolver = createResolver_1.createResolver(exports.UserDataFromSessionResolverInput, t.number, model_1.getUserExpectedWorkingHours);
var userActualWorkingHoursResolver = createResolver_1.createResolver(exports.UserDataFromSessionResolverInput, t.number, model_1.getUserActualWorkingHours);
var userBudgetResolver = createResolver_1.createResolver(exports.UserDataFromSessionResolverInput, t.number, model_1.getUserBudget);
var userBalanceResolver = createResolver_1.createResolver(exports.UserDataFromSessionResolverInput, t.number, model_1.getUserBalance);
var StartSessionMutationInput = t.type({
    task: Types_1.PositiveInteger
}, 'StartSessionMutationInput');
var startSessionMutation = createResolver_1.createResolver(StartSessionMutationInput, interface_1.Session, function (_parent, _a, context) {
    var task = _a.task;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.startSession(task, user); }));
});
var StopSessionMutationInput = t.type({
    id: Types_1.PositiveInteger
}, 'StopSessionMutationInput');
var stopSessionMutation = createResolver_1.createResolver(StopSessionMutationInput, interface_1.Session, function (_parent, _a, context) {
    var id = _a.id;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.stopSession(id, user); }));
});
var UpdateSessionMutationInput = t.type({ id: Types_1.PositiveInteger, session: interface_1.SessionUpdateInput }, 'UpdateSessionMutationInput');
var updateSessionMutation = createResolver_1.createResolver(UpdateSessionMutationInput, interface_1.Session, function (_parent, _a, context) {
    var id = _a.id, session = _a.session;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.updateSession(id, session, user); }));
});
var DeleteSessionMutationInput = t.type({ id: Types_1.PositiveInteger }, 'DeleteSessionMutationInput');
var deleteSessionMutation = createResolver_1.createResolver(DeleteSessionMutationInput, interface_1.Session, function (_parent, _a, context) {
    var id = _a.id;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.deleteSession(id, user); }));
});
var createTimesheetMutation = createResolver_1.createResolver(interface_1.TimesheetCreationInput, t.string, function (_parent, args, context) {
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.createTimesheet(args, user); }));
});
var SessionQueryInput = t.type({ id: Types_1.PositiveInteger }, 'SessionQueryInput');
var sessionQuery = createResolver_1.createResolver(SessionQueryInput, interface_1.Session, function (_parent, _a, context) {
    var id = _a.id;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.getSession(id, user); }));
});
var SessionsQueryInput = t.intersection([
    ConnectionQueryArgs_1.ConnectionQueryArgs,
    t.type({
        task: io_ts_types_1.optionFromNullable(Types_1.PositiveInteger)
    })
], 'SessionsQueryInput');
var sessionsQuery = createResolver_1.createResolver(SessionsQueryInput, Connection_1.Connection(interface_1.Session), function (_parent, args, context) {
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.listSessions(args, user); }));
});
exports.default = {
    Session: {
        task: sessionTaskResolver
    },
    Task: {
        sessions: taskSessionsResolver,
        actualWorkingHours: taskActualWorkingHoursResolver,
        budget: taskBudgetResolver,
        balance: taskBalanceResolver
    },
    Project: {
        expectedWorkingHours: projectExpectedWorkingHoursResolver,
        actualWorkingHours: projectActualWorkingHoursResolver,
        budget: projectBudgetResolver,
        balance: projectBalanceResolver
    },
    User: {
        openSessions: userOpenSessionsResolver,
        expectedWorkingHours: userExpectedWorkingHoursResolver,
        actualWorkingHours: userActualWorkingHoursResolver,
        budget: userBudgetResolver,
        balance: userBalanceResolver
    },
    Mutation: {
        startSession: startSessionMutation,
        stopSession: stopSessionMutation,
        updateSession: updateSessionMutation,
        deleteSession: deleteSessionMutation,
        createTimesheet: createTimesheetMutation
    },
    Query: {
        session: sessionQuery,
        sessions: sessionsQuery
    }
};
