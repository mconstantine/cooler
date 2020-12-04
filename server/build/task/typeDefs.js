"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var apollo_server_express_1 = require("apollo-server-express");
exports.default = apollo_server_express_1.gql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  type TaskEdge implements Edge {\n    cursor: String!\n    node: Task!\n  }\n\n  type TaskConnection implements Connection {\n    pageInfo: PageInfo!\n    edges: [TaskEdge]!\n    totalCount: Int!\n  }\n\n  type Task implements TrackedNode & Node {\n    id: Int!\n    name: String!\n    description: String\n    expectedWorkingHours: Int!\n    hourlyCost: Float!\n    start_time: Date!\n    created_at: Date!\n    updated_at: Date!\n    project: Project!\n  }\n\n  input TaskCreationInput {\n    name: String!\n    description: String\n    expectedWorkingHours: Int!\n    hourlyCost: Float!\n    project: Int!\n    start_time: Date!\n  }\n\n  input TasksBatchCreationInput {\n    name: String!\n    expectedWorkingHours: Int!\n    hourlyCost: Float!\n    project: Int!\n    start_time: Date!\n    from: Date!\n    to: Date!\n    repeat: Int!\n  }\n\n  input TaskUpdateInput {\n    name: String\n    description: String\n    expectedWorkingHours: Int\n    hourlyCost: Float\n    project: Int\n    start_time: Date\n  }\n\n  extend type User {\n    tasks(\n      first: Int\n      last: Int\n      before: String\n      after: String\n      orderBy: String\n      from: Date\n      to: Date\n    ): TaskConnection!\n  }\n\n  extend type Project {\n    tasks(\n      first: Int\n      last: Int\n      before: String\n      after: String\n      orderBy: String\n    ): TaskConnection!\n  }\n\n  extend type Mutation {\n    createTask(task: TaskCreationInput!): Task!\n    createTasksBatch(input: TasksBatchCreationInput): Project!\n    updateTask(id: Int!, task: TaskUpdateInput!): Task!\n    deleteTask(id: Int!): Task!\n  }\n\n  extend type Query {\n    task(id: Int!): Task\n    tasks(\n      description: String\n      first: Int\n      last: Int\n      before: String\n      after: String\n      orderBy: String\n    ): TaskConnection!\n  }\n\n  # extend type Subscription {\n  #   createdTask(project: Int, from: Date, to: Date): Task!\n  # }\n"], ["\n  type TaskEdge implements Edge {\n    cursor: String!\n    node: Task!\n  }\n\n  type TaskConnection implements Connection {\n    pageInfo: PageInfo!\n    edges: [TaskEdge]!\n    totalCount: Int!\n  }\n\n  type Task implements TrackedNode & Node {\n    id: Int!\n    name: String!\n    description: String\n    expectedWorkingHours: Int!\n    hourlyCost: Float!\n    start_time: Date!\n    created_at: Date!\n    updated_at: Date!\n    project: Project!\n  }\n\n  input TaskCreationInput {\n    name: String!\n    description: String\n    expectedWorkingHours: Int!\n    hourlyCost: Float!\n    project: Int!\n    start_time: Date!\n  }\n\n  input TasksBatchCreationInput {\n    name: String!\n    expectedWorkingHours: Int!\n    hourlyCost: Float!\n    project: Int!\n    start_time: Date!\n    from: Date!\n    to: Date!\n    repeat: Int!\n  }\n\n  input TaskUpdateInput {\n    name: String\n    description: String\n    expectedWorkingHours: Int\n    hourlyCost: Float\n    project: Int\n    start_time: Date\n  }\n\n  extend type User {\n    tasks(\n      first: Int\n      last: Int\n      before: String\n      after: String\n      orderBy: String\n      from: Date\n      to: Date\n    ): TaskConnection!\n  }\n\n  extend type Project {\n    tasks(\n      first: Int\n      last: Int\n      before: String\n      after: String\n      orderBy: String\n    ): TaskConnection!\n  }\n\n  extend type Mutation {\n    createTask(task: TaskCreationInput!): Task!\n    createTasksBatch(input: TasksBatchCreationInput): Project!\n    updateTask(id: Int!, task: TaskUpdateInput!): Task!\n    deleteTask(id: Int!): Task!\n  }\n\n  extend type Query {\n    task(id: Int!): Task\n    tasks(\n      description: String\n      first: Int\n      last: Int\n      before: String\n      after: String\n      orderBy: String\n    ): TaskConnection!\n  }\n\n  # extend type Subscription {\n  #   createdTask(project: Int, from: Date, to: Date): Task!\n  # }\n"])));
var templateObject_1;
