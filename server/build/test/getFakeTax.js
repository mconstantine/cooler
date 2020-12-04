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
exports.getFakeTax = void 0;
var faker_1 = __importDefault(require("faker"));
function getFakeTax(user, data) {
    if (data === void 0) { data = {}; }
    return __assign({ label: faker_1.default.lorem.word(), value: (Math.floor(Math.random() * 10000) / 10000), user: user }, data);
}
exports.getFakeTax = getFakeTax;
