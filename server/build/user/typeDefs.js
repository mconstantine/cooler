"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var apollo_server_express_1 = require("apollo-server-express");
exports.default = apollo_server_express_1.gql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  type UserEdge implements Edge {\n    cursor: String!\n    node: User!\n  }\n\n  type UserConnection implements Connection {\n    pageInfo: PageInfo!\n    edges: [UserEdge]!\n    totalCount: Int!\n  }\n\n  type User implements TrackedNode & Node {\n    id: Int!\n    name: String!\n    email: String!\n    password: String!\n    created_at: Date!\n    updated_at: Date!\n  }\n\n  input UserCreationInput {\n    name: String!\n    email: String!\n    password: String!\n  }\n\n  input UserLoginInput {\n    email: String!\n    password: String!\n  }\n\n  input UserUpdateInput {\n    name: String\n    email: String\n    password: String\n  }\n\n  type TokenResponse {\n    accessToken: String!\n    refreshToken: String!\n    expiration: Date!\n  }\n\n  extend type Mutation {\n    createUser(user: UserCreationInput!): TokenResponse\n    loginUser(user: UserLoginInput!): TokenResponse!\n    updateMe(user: UserUpdateInput!): User\n    deleteMe: User\n    refreshToken(refreshToken: String!): TokenResponse!\n  }\n\n  extend type Query {\n    me: User\n  }\n"], ["\n  type UserEdge implements Edge {\n    cursor: String!\n    node: User!\n  }\n\n  type UserConnection implements Connection {\n    pageInfo: PageInfo!\n    edges: [UserEdge]!\n    totalCount: Int!\n  }\n\n  type User implements TrackedNode & Node {\n    id: Int!\n    name: String!\n    email: String!\n    password: String!\n    created_at: Date!\n    updated_at: Date!\n  }\n\n  input UserCreationInput {\n    name: String!\n    email: String!\n    password: String!\n  }\n\n  input UserLoginInput {\n    email: String!\n    password: String!\n  }\n\n  input UserUpdateInput {\n    name: String\n    email: String\n    password: String\n  }\n\n  type TokenResponse {\n    accessToken: String!\n    refreshToken: String!\n    expiration: Date!\n  }\n\n  extend type Mutation {\n    createUser(user: UserCreationInput!): TokenResponse\n    loginUser(user: UserLoginInput!): TokenResponse!\n    updateMe(user: UserUpdateInput!): User\n    deleteMe: User\n    refreshToken(refreshToken: String!): TokenResponse!\n  }\n\n  extend type Query {\n    me: User\n  }\n"])));
var templateObject_1;
