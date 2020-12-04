"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
var resolvers_1 = __importDefault(require("./user/resolvers"));
var resolvers_2 = __importDefault(require("./client/resolvers"));
var resolvers_3 = __importDefault(require("./project/resolvers"));
var resolvers_4 = __importDefault(require("./task/resolvers"));
var resolvers_5 = __importDefault(require("./session/resolvers"));
var resolvers_6 = __importDefault(require("./tax/resolvers"));
var merge_1 = require("./misc/merge");
var graphql_1 = require("graphql");
var defaultResolvers = {
    Node: { __resolveType: function () { return 'Node'; } },
    TrackedNode: { __resolveType: function () { return 'TrackedNode'; } },
    Edge: { __resolveType: function () { return 'Edge'; } },
    Connection: { __resolveType: function () { return 'Connection'; } },
    Date: new graphql_1.GraphQLScalarType({
        name: 'Date',
        description: 'Represents a JavaScript date'
    })
};
exports.resolvers = [
    defaultResolvers,
    resolvers_1.default,
    resolvers_2.default,
    resolvers_3.default,
    resolvers_4.default,
    resolvers_5.default,
    resolvers_6.default
].reduce(function (res, resolvers) { return merge_1.merge(res, resolvers); }, {});
