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
exports.ProjectConnectionQueryArgs = void 0;
var interface_1 = require("./interface");
var model_1 = require("./model");
var interface_2 = require("../client/interface");
var ConnectionQueryArgs_1 = require("../misc/ConnectionQueryArgs");
var ensureUser_1 = require("../misc/ensureUser");
var Connection_1 = require("../misc/Connection");
var t = __importStar(require("io-ts"));
var fp_ts_1 = require("fp-ts");
var createResolver_1 = require("../misc/createResolver");
var Types_1 = require("../misc/Types");
var io_ts_types_1 = require("io-ts-types");
var function_1 = require("fp-ts/function");
var projectClientResolver = createResolver_1.createResolver(Types_1.EmptyObject, interface_2.Client, function (project) { return model_1.getProjectClient(project); });
var clientProjectsResolver = createResolver_1.createResolver(ConnectionQueryArgs_1.ConnectionQueryArgs, Connection_1.Connection(interface_1.Project), function (client, args) { return model_1.getClientProjects(client, args); });
var userProjectsResolver = createResolver_1.createResolver(ConnectionQueryArgs_1.ConnectionQueryArgs, Connection_1.Connection(interface_1.Project), function (user, args) { return model_1.getUserProjects(user, args); });
var UserCashedBalanceResolverInput = t.type({
    since: io_ts_types_1.optionFromNullable(io_ts_types_1.DateFromISOString)
}, 'UserCashedBalanceResolverInput');
var userCashedBalanceResolver = createResolver_1.createResolver(UserCashedBalanceResolverInput, Types_1.NonNegativeNumber, function (user, _a) {
    var since = _a.since;
    return model_1.getUserCashedBalance(user, since);
});
var CreateProjectMutationInput = t.type({
    project: interface_1.ProjectCreationInput
}, 'CreateProjectMutationInput');
var createProjectMutation = createResolver_1.createResolver(CreateProjectMutationInput, interface_1.Project, function (_parent, _a, context) {
    var project = _a.project;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.createProject(project, user); }));
});
var UpdateProjectMutationInput = t.type({
    id: Types_1.PositiveInteger,
    project: interface_1.ProjectUpdateInput
}, 'UpdateProjectMutationInput');
var updateProjectMutation = createResolver_1.createResolver(UpdateProjectMutationInput, interface_1.Project, function (_parent, _a, context) {
    var id = _a.id, project = _a.project;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.updateProject(id, project, user); }));
});
var DeleteProjectMutationInput = t.type({
    id: Types_1.PositiveInteger
}, 'DeleteProjectMutationInput');
var deleteProjectMutation = createResolver_1.createResolver(DeleteProjectMutationInput, interface_1.Project, function (_parent, _a, context) {
    var id = _a.id;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.deleteProject(id, user); }));
});
var ProjectQueryInput = t.type({
    id: Types_1.PositiveInteger
}, 'ProjectQueryInput');
var projectQuery = createResolver_1.createResolver(ProjectQueryInput, interface_1.Project, function (_parent, _a, context) {
    var id = _a.id;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.getProject(id, user); }));
});
exports.ProjectConnectionQueryArgs = t.intersection([
    ConnectionQueryArgs_1.ConnectionQueryArgs,
    t.type({
        name: io_ts_types_1.optionFromNullable(io_ts_types_1.NonEmptyString)
    })
], 'ProjectConnectionQueryArgs');
var projectsQuery = createResolver_1.createResolver(exports.ProjectConnectionQueryArgs, Connection_1.Connection(interface_1.Project), function (_parent, args, context) {
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.listProjects(args, user); }));
});
var resolvers = {
    Project: {
        client: projectClientResolver
    },
    User: {
        projects: userProjectsResolver,
        cashedBalance: userCashedBalanceResolver
    },
    Client: {
        projects: clientProjectsResolver
    },
    Mutation: {
        createProject: createProjectMutation,
        updateProject: updateProjectMutation,
        deleteProject: deleteProjectMutation
    },
    Query: {
        project: projectQuery,
        projects: projectsQuery
    }
};
exports.default = resolvers;
