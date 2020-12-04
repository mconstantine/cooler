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
exports.TimesheetCreationInput = exports.SessionUpdateInput = exports.SessionCreationInput = exports.DatabaseSession = exports.Session = void 0;
var t = __importStar(require("io-ts"));
var io_ts_types_1 = require("io-ts-types");
var Types_1 = require("../misc/Types");
exports.Session = t.type({
    id: Types_1.PositiveInteger,
    task: Types_1.PositiveInteger,
    start_time: io_ts_types_1.DateFromISOString,
    end_time: io_ts_types_1.optionFromNullable(io_ts_types_1.DateFromISOString)
}, 'Session');
exports.DatabaseSession = t.type({
    id: Types_1.PositiveInteger,
    task: Types_1.PositiveInteger,
    start_time: Types_1.DateFromSQLDate,
    end_time: io_ts_types_1.optionFromNullable(Types_1.DateFromSQLDate),
    user: Types_1.PositiveInteger
}, 'DatabaseSession');
exports.SessionCreationInput = t.type({
    task: Types_1.PositiveInteger,
    start_time: Types_1.DateFromSQLDate,
    end_time: io_ts_types_1.optionFromNullable(Types_1.DateFromSQLDate)
}, 'SessionCreationInput');
exports.SessionUpdateInput = t.partial({
    task: Types_1.PositiveInteger,
    start_time: Types_1.DateFromSQLDate,
    end_time: Types_1.optionFromNull(Types_1.DateFromSQLDate)
}, 'SessionUpdateInput');
exports.TimesheetCreationInput = t.type({
    since: io_ts_types_1.DateFromISOString,
    to: io_ts_types_1.DateFromISOString,
    project: Types_1.PositiveInteger
}, 'TimesheetCreationInput');
