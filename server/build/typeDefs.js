"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
var typeDefs_1 = __importDefault(require("./user/typeDefs"));
var typeDefs_2 = __importDefault(require("./client/typeDefs"));
var typeDefs_3 = __importDefault(require("./project/typeDefs"));
var typeDefs_4 = __importDefault(require("./task/typeDefs"));
var typeDefs_5 = __importDefault(require("./session/typeDefs"));
var typeDefs_6 = __importDefault(require("./tax/typeDefs"));
var apollo_server_express_1 = require("apollo-server-express");
var defaultTypeDefs = apollo_server_express_1.gql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  scalar Date\n\n  type PageInfo {\n    startCursor: String!\n    endCursor: String!\n    hasNextPage: Boolean!\n    hasPreviousPage: Boolean!\n  }\n\n  interface Node {\n    id: Int!\n  }\n\n  interface TrackedNode implements Node {\n    id: Int!\n    created_at: Date!\n    updated_at: Date!\n  }\n\n  interface Edge {\n    cursor: String!\n    node: Node!\n  }\n\n  interface Connection {\n    pageInfo: PageInfo!\n    edges: [Edge]!\n    totalCount: Int!\n  }\n\n  type Query {\n    _empty: String\n  }\n\n  type Mutation {\n    _empty: String\n  }\n\n  type Subscription {\n    _empty: String\n  }\n"], ["\n  scalar Date\n\n  type PageInfo {\n    startCursor: String!\n    endCursor: String!\n    hasNextPage: Boolean!\n    hasPreviousPage: Boolean!\n  }\n\n  interface Node {\n    id: Int!\n  }\n\n  interface TrackedNode implements Node {\n    id: Int!\n    created_at: Date!\n    updated_at: Date!\n  }\n\n  interface Edge {\n    cursor: String!\n    node: Node!\n  }\n\n  interface Connection {\n    pageInfo: PageInfo!\n    edges: [Edge]!\n    totalCount: Int!\n  }\n\n  type Query {\n    _empty: String\n  }\n\n  type Mutation {\n    _empty: String\n  }\n\n  type Subscription {\n    _empty: String\n  }\n"])));
exports.typeDefs = [
    defaultTypeDefs,
    typeDefs_1.default,
    typeDefs_2.default,
    typeDefs_3.default,
    typeDefs_4.default,
    typeDefs_5.default,
    typeDefs_6.default
];
var templateObject_1;
