"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUserContext = exports.ensureUser = void 0;
var function_1 = require("fp-ts/function");
var fp_ts_1 = require("fp-ts");
var Types_1 = require("./Types");
function ensureUser(context) {
    return function_1.pipe(isUserContext(context), fp_ts_1.boolean.fold(function () { return fp_ts_1.taskEither.left(Types_1.coolerError('COOLER_401', 'Unauthorized')); }, function () { return fp_ts_1.taskEither.right(context.user); }));
}
exports.ensureUser = ensureUser;
function isUserContext(context) {
    return 'user' in context;
}
exports.isUserContext = isUserContext;
