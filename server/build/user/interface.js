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
exports.UserUpdateInput = exports.RefreshTokenInput = exports.UserLoginInput = exports.UserCreationInput = exports.AccessTokenResponse = exports.Context = exports.UserContext = exports.Token = exports.TokenType = exports.DatabaseUser = exports.User = void 0;
var t = __importStar(require("io-ts"));
var io_ts_types_1 = require("io-ts-types");
var Types_1 = require("../misc/Types");
exports.User = t.type({
    id: Types_1.PositiveInteger,
    name: io_ts_types_1.NonEmptyString,
    email: Types_1.EmailString,
    password: io_ts_types_1.NonEmptyString,
    created_at: io_ts_types_1.DateFromISOString,
    updated_at: io_ts_types_1.DateFromISOString
}, 'User');
exports.DatabaseUser = t.type({
    id: Types_1.PositiveInteger,
    name: io_ts_types_1.NonEmptyString,
    email: Types_1.EmailString,
    password: io_ts_types_1.NonEmptyString,
    created_at: Types_1.DateFromSQLDate,
    updated_at: Types_1.DateFromSQLDate
}, 'DatabaseUser');
exports.TokenType = t.keyof({
    ACCESS: true,
    REFRESH: true
}, 'TokenType');
exports.Token = t.type({
    type: exports.TokenType,
    id: Types_1.PositiveInteger
}, 'Token');
exports.UserContext = t.type({
    user: exports.User
}, 'UserContext');
exports.Context = t.union([t.type({}), exports.UserContext], 'Context');
exports.AccessTokenResponse = t.type({
    accessToken: io_ts_types_1.NonEmptyString,
    refreshToken: io_ts_types_1.NonEmptyString,
    expiration: io_ts_types_1.DateFromISOString
}, 'AccessTokenResponse');
exports.UserCreationInput = t.type({
    name: io_ts_types_1.NonEmptyString,
    email: Types_1.EmailString,
    password: io_ts_types_1.NonEmptyString
}, 'UserCreationInput');
exports.UserLoginInput = t.type({
    email: Types_1.EmailString,
    password: io_ts_types_1.NonEmptyString
}, 'UserLoginInput');
exports.RefreshTokenInput = t.type({
    refreshToken: io_ts_types_1.NonEmptyString
}, 'RefreshTokenInput');
exports.UserUpdateInput = t.partial({
    name: io_ts_types_1.NonEmptyString,
    email: Types_1.EmailString,
    password: io_ts_types_1.NonEmptyString
}, 'UserUpdateInput');
