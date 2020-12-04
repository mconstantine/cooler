"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientConnectionQuerysArgs = void 0;
var interface_1 = require("./interface");
var model_1 = require("./model");
var ConnectionQueryArgs_1 = require("../misc/ConnectionQueryArgs");
var ensureUser_1 = require("../misc/ensureUser");
var interface_2 = require("../user/interface");
var Connection_1 = require("../misc/Connection");
var createResolver_1 = require("../misc/createResolver");
var t = __importStar(require("io-ts"));
var fp_ts_1 = require("fp-ts");
var Types_1 = require("../misc/Types");
var function_1 = require("fp-ts/function");
var io_ts_types_1 = require("io-ts-types");
var clientNameResolver = createResolver_1.createResolver(Types_1.EmptyObject, io_ts_types_1.NonEmptyString, function (client) { return fp_ts_1.taskEither.right(model_1.getClientName(client)); });
var clientUserResolver = createResolver_1.createResolver(Types_1.EmptyObject, interface_2.User, function (client) {
    return model_1.getClientUser(client);
});
var userClientsResolver = createResolver_1.createResolver(ConnectionQueryArgs_1.ConnectionQueryArgs, Connection_1.Connection(interface_1.Client), function (user, args) { return model_1.getUserClients(user, args); });
var CreateClientMutationInput = t.type({
    client: interface_1.ClientCreationInput
}, 'CreateClientMutationInput');
var createClientMutation = createResolver_1.createResolver(CreateClientMutationInput, interface_1.Client, function (_parent, _a, context) {
    var client = _a.client;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.createClient(__assign({}, client), user); }));
});
var UpdateClientMutationInput = t.type({
    id: Types_1.PositiveInteger,
    client: interface_1.ClientUpdateInput
}, 'UpdateClientMutationInput');
var updateClientMutation = createResolver_1.createResolver(UpdateClientMutationInput, interface_1.Client, function (_parent, _a, context) {
    var id = _a.id, client = _a.client;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.updateClient(id, client, user); }));
});
var DeleteClientMutationInput = t.type({
    id: Types_1.PositiveInteger
}, 'DeleteClientMutationInput');
var deleteClientMutation = createResolver_1.createResolver(DeleteClientMutationInput, interface_1.Client, function (_parent, _a, context) {
    var id = _a.id;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.deleteClient(id, user); }));
});
var ClientQueryInput = t.type({
    id: Types_1.PositiveInteger
}, 'ClientQueryInput');
var clientQuery = createResolver_1.createResolver(ClientQueryInput, interface_1.Client, function (_parent, _a, context) {
    var id = _a.id;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.getClient(id, user); }));
});
exports.ClientConnectionQuerysArgs = t.intersection([
    ConnectionQueryArgs_1.ConnectionQueryArgs,
    t.type({
        name: io_ts_types_1.optionFromNullable(io_ts_types_1.NonEmptyString)
    })
], 'ClientConnectionQuerysArgs');
var clientsQuery = createResolver_1.createResolver(exports.ClientConnectionQuerysArgs, Connection_1.Connection(interface_1.Client), function (_parent, args, context) {
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.listClients(args, user); }));
});
var resolvers = {
    Client: {
        name: clientNameResolver,
        user: clientUserResolver
    },
    User: {
        clients: userClientsResolver
    },
    Mutation: {
        createClient: createClientMutation,
        updateClient: updateClientMutation,
        deleteClient: deleteClientMutation
    },
    Query: {
        client: clientQuery,
        clients: clientsQuery
    }
};
exports.default = resolvers;
