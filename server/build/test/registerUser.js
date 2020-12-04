"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = void 0;
var fp_ts_1 = require("fp-ts");
var function_1 = require("fp-ts/function");
var jsonWebToken_1 = require("../misc/jsonWebToken");
var database_1 = require("../user/database");
var model_1 = require("../user/model");
var util_1 = require("./util");
function registerUser(user, register) {
    return function_1.pipe(model_1.createUser(user, register ? { user: register } : {}), fp_ts_1.taskEither.map(function (_a) {
        var accessToken = _a.accessToken;
        return jsonWebToken_1.verifyToken(accessToken);
    }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), fp_ts_1.taskEither.chain(function (token) { return database_1.getUserById(token.id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)));
}
exports.registerUser = registerUser;
