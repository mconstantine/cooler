"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFakeTask = void 0;
var faker_1 = __importDefault(require("faker"));
var fp_ts_1 = require("fp-ts");
var function_1 = require("fp-ts/function");
function getFakeTask(project, data) {
    if (data === void 0) { data = {}; }
    return __assign({ name: faker_1.default.lorem.sentence(), description: function_1.pipe(Math.random() < 0.5, fp_ts_1.boolean.fold(function () { return fp_ts_1.option.none; }, function () { return fp_ts_1.option.some(faker_1.default.lorem.paragraph()); })), expectedWorkingHours: (1 + faker_1.default.random.number(99)), hourlyCost: (10 +
            Math.floor(Math.random() * 10 * 2) / 2), start_time: function_1.pipe(Math.random() < 0.5, fp_ts_1.boolean.fold(function () { return faker_1.default.date.future(1); }, function () { return faker_1.default.date.future(-1); })), project: project }, data);
}
exports.getFakeTask = getFakeTask;
