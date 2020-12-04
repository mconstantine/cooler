"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.signToken = void 0;
var fp_ts_1 = require("fp-ts");
var function_1 = require("fp-ts/function");
var jsonwebtoken_1 = require("jsonwebtoken");
function signToken(token, options) {
    return jsonwebtoken_1.sign(token, process.env.SECRET, options);
}
exports.signToken = signToken;
function verifyToken(token, options) {
    return function_1.pipe(fp_ts_1.either.tryCatch(function () { return jsonwebtoken_1.verify(token, process.env.SECRET, options); }, function_1.constVoid), fp_ts_1.option.fromEither);
}
exports.verifyToken = verifyToken;
