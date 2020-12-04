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
exports.TaskUpdateInput = exports.TasksBatchCreationInput = exports.TaskCreationInput = exports.DatabaseTask = exports.Task = void 0;
var t = __importStar(require("io-ts"));
var io_ts_types_1 = require("io-ts-types");
var Types_1 = require("../misc/Types");
var TaskCommonData = t.type({
    id: Types_1.PositiveInteger,
    name: io_ts_types_1.NonEmptyString,
    description: io_ts_types_1.optionFromNullable(io_ts_types_1.NonEmptyString),
    expectedWorkingHours: Types_1.NonNegativeNumber,
    hourlyCost: Types_1.NonNegativeNumber,
    project: Types_1.PositiveInteger
}, 'TaskCommonData');
exports.Task = t.intersection([
    TaskCommonData,
    t.type({
        start_time: io_ts_types_1.DateFromISOString,
        created_at: io_ts_types_1.DateFromISOString,
        updated_at: io_ts_types_1.DateFromISOString
    })
], 'Task');
exports.DatabaseTask = t.intersection([
    TaskCommonData,
    t.type({
        user: Types_1.PositiveInteger,
        start_time: Types_1.DateFromSQLDate,
        created_at: Types_1.DateFromSQLDate,
        updated_at: Types_1.DateFromSQLDate
    })
], 'DatabaseTask');
exports.TaskCreationInput = t.type({
    name: io_ts_types_1.NonEmptyString,
    description: io_ts_types_1.optionFromNullable(io_ts_types_1.NonEmptyString),
    expectedWorkingHours: Types_1.NonNegativeNumber,
    hourlyCost: Types_1.NonNegativeNumber,
    project: Types_1.PositiveInteger,
    start_time: Types_1.DateFromSQLDate
}, 'TaskCreationInput');
exports.TasksBatchCreationInput = t.type({
    name: io_ts_types_1.NonEmptyString,
    expectedWorkingHours: Types_1.NonNegativeNumber,
    hourlyCost: Types_1.NonNegativeNumber,
    project: Types_1.PositiveInteger,
    start_time: io_ts_types_1.DateFromISOString,
    from: io_ts_types_1.DateFromISOString,
    to: io_ts_types_1.DateFromISOString,
    repeat: Types_1.NonNegativeInteger
}, 'TasksBatchCreationInput');
exports.TaskUpdateInput = t.partial({
    name: io_ts_types_1.NonEmptyString,
    description: io_ts_types_1.optionFromNullable(io_ts_types_1.NonEmptyString),
    expectedWorkingHours: Types_1.NonNegativeNumber,
    hourlyCost: Types_1.NonNegativeNumber,
    project: Types_1.PositiveInteger,
    start_time: Types_1.DateFromSQLDate
}, 'TaskUpdateInput');
