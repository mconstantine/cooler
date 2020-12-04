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
var interface_1 = require("./interface");
var model_1 = require("./model");
var ensureUser_1 = require("../misc/ensureUser");
var createResolver_1 = require("../misc/createResolver");
var t = __importStar(require("io-ts"));
var function_1 = require("fp-ts/function");
var fp_ts_1 = require("fp-ts");
var Types_1 = require("../misc/Types");
var CreateUserMutationInput = t.type({
    user: interface_1.UserCreationInput
}, 'CreateUserMutationInput');
var createUserMutation = createResolver_1.createResolver(CreateUserMutationInput, interface_1.AccessTokenResponse, function (_parent, _a, context) {
    var user = _a.user;
    return model_1.createUser(user, context);
});
var LoginUserMutationInput = t.type({
    user: interface_1.UserLoginInput
}, 'LoginUserMutationInput');
var loginUserMutation = createResolver_1.createResolver(LoginUserMutationInput, interface_1.AccessTokenResponse, function (_parent, _a) {
    var user = _a.user;
    return model_1.loginUser(user);
});
var refreshTokenMutation = createResolver_1.createResolver(interface_1.RefreshTokenInput, interface_1.AccessTokenResponse, function (_parent, args) { return model_1.refreshToken(args); });
var UpdateMeMutationInput = t.type({
    user: interface_1.UserUpdateInput
}, 'UpdateMeMutationInput');
var updateMeMutation = createResolver_1.createResolver(UpdateMeMutationInput, interface_1.User, function (_parent, _a, context) {
    var user = _a.user;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (contextUser) { return model_1.updateUser(contextUser.id, user); }));
});
var deleteMeMutation = createResolver_1.createResolver(Types_1.EmptyObject, interface_1.User, function (_parent, _args, context) {
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.deleteUser(user.id); }));
});
var meQuery = createResolver_1.createResolver(Types_1.EmptyObject, interface_1.User, function (_parent, _args, context) {
    return function_1.pipe(model_1.getUserFromContext(context), fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_403', 'Unauthorized'); }));
});
var resolvers = {
    Mutation: {
        createUser: createUserMutation,
        loginUser: loginUserMutation,
        refreshToken: refreshTokenMutation,
        updateMe: updateMeMutation,
        deleteMe: deleteMeMutation
    },
    Query: {
        me: meQuery
    }
};
exports.default = resolvers;
