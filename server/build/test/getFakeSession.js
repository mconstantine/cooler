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
exports.getFakeSession = void 0;
var faker_1 = __importDefault(require("faker"));
var fp_ts_1 = require("fp-ts");
function getFakeSession(task, data) {
    var _a;
    var startTime = (_a = data === null || data === void 0 ? void 0 : data.start_time) !== null && _a !== void 0 ? _a : (function () {
        var date = faker_1.default.date.recent(10);
        date.setMilliseconds(0);
        return date;
    })();
    var endTime = new Date(startTime.getTime() + 900000 + Math.round(Math.random() * 28800000 - 900000));
    endTime.setMilliseconds(0);
    return __assign({ start_time: startTime, end_time: fp_ts_1.option.some(endTime), task: task }, data);
}
exports.getFakeSession = getFakeSession;
