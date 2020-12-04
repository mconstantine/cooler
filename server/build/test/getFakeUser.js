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
exports.getFakeUser = void 0;
var faker_1 = __importDefault(require("faker"));
function getFakeUser(data) {
    if (data === void 0) { data = {}; }
    var firstName = faker_1.default.name.firstName();
    var lastName = faker_1.default.name.lastName();
    return __assign({ name: firstName + " " + lastName, email: faker_1.default.internet.email(firstName, lastName), password: faker_1.default.internet.password() }, data);
}
exports.getFakeUser = getFakeUser;
