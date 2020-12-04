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
exports.TaxUpdateInput = exports.TaxCreationInput = exports.Tax = void 0;
var t = __importStar(require("io-ts"));
var io_ts_types_1 = require("io-ts-types");
var Types_1 = require("../misc/Types");
exports.Tax = t.type({
    id: Types_1.PositiveInteger,
    label: io_ts_types_1.NonEmptyString,
    value: Types_1.Percentage,
    user: Types_1.PositiveInteger
}, 'Tax');
exports.TaxCreationInput = t.type({
    label: io_ts_types_1.NonEmptyString,
    value: Types_1.Percentage,
    user: Types_1.PositiveInteger
}, 'TaxCreationInput');
exports.TaxUpdateInput = t.partial({
    label: io_ts_types_1.NonEmptyString,
    value: Types_1.Percentage,
    user: Types_1.PositiveInteger
}, 'TaxUpdateInput');
