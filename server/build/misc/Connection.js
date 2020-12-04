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
exports.Connection = exports.Edge = void 0;
var t = __importStar(require("io-ts"));
var io_ts_types_1 = require("io-ts-types");
var Types_1 = require("./Types");
exports.Edge = function (T) {
    return t.type({
        node: T,
        cursor: io_ts_types_1.NonEmptyString
    }, "Edge<" + T.name + ">");
};
exports.Connection = function (T) {
    return t.type({
        totalCount: Types_1.NonNegativeInteger,
        edges: t.array(exports.Edge(T)),
        pageInfo: t.type({
            startCursor: io_ts_types_1.optionFromNullable(io_ts_types_1.NonEmptyString),
            endCursor: io_ts_types_1.optionFromNullable(io_ts_types_1.NonEmptyString),
            hasNextPage: t.boolean,
            hasPreviousPage: t.boolean
        }, 'PageInfo')
    }, "Connection<" + T.name + ">");
};
