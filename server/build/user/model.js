"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserFromContext = exports.deleteUser = exports.updateUser = exports.refreshToken = exports.loginUser = exports.createUser = void 0;
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var dbUtils_1 = require("../misc/dbUtils");
var bcryptjs_1 = require("bcryptjs");
var ensureUser_1 = require("../misc/ensureUser");
var removeUndefined_1 = require("../misc/removeUndefined");
var fp_ts_1 = require("fp-ts");
var function_1 = require("fp-ts/function");
var Types_1 = require("../misc/Types");
var database_1 = require("./database");
var io_ts_1 = require("io-ts");
var jsonWebToken_1 = require("../misc/jsonWebToken");
function createUser(input, context) {
    var name = input.name, email = input.email, password = input.password;
    return function_1.pipe(ensureUser_1.isUserContext(context), fp_ts_1.boolean.fold(function () {
        return function_1.pipe(dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT COUNT(id) as count FROM user"], ["SELECT COUNT(id) as count FROM user"]))), io_ts_1.type({ count: io_ts_1.Int })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
            return Types_1.coolerError('COOLER_500', 'Unable to count existing users');
        })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (_a) {
            var count = _a.count;
            return count === 0;
        }, function () {
            return Types_1.coolerError('COOLER_403', 'Only existing users can create new users');
        })));
    }, function () { return fp_ts_1.taskEither.fromIO(function () { return ({ count: 0 }); }); }), fp_ts_1.taskEither.chain(function () { return database_1.getUserByEmail(email); }), fp_ts_1.taskEither.chain(fp_ts_1.option.fold(function () { return fp_ts_1.taskEither.right(void 0); }, function () { return fp_ts_1.taskEither.left(Types_1.coolerError('COOLER_409', 'Duplicate user')); })), fp_ts_1.taskEither.chain(function () {
        return database_1.insertUser({
            name: name,
            email: email,
            password: bcryptjs_1.hashSync(password, 10)
        });
    }), fp_ts_1.taskEither.map(generateTokens));
}
exports.createUser = createUser;
function loginUser(input) {
    var email = input.email, password = input.password;
    return function_1.pipe(database_1.getUserByEmail(email), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'User not found'); })), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (user) { return bcryptjs_1.compareSync(password, user.password); }, function () { return Types_1.coolerError('COOLER_400', 'Wrong password'); })), fp_ts_1.taskEither.map(function (_a) {
        var id = _a.id;
        return generateTokens(id);
    }));
}
exports.loginUser = loginUser;
function refreshToken(input) {
    var refreshToken = input.refreshToken;
    return function_1.pipe(jsonWebToken_1.verifyToken(refreshToken, {
        ignoreExpiration: true
    }), fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_400', 'Invalid token'); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromPredicate(function (token) { return token.type === 'REFRESH'; }, function () { return Types_1.coolerError('COOLER_400', 'Invalid token type'); })), fp_ts_1.taskEither.chain(function (token) { return database_1.getUserById(token.id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'User not found'); })), fp_ts_1.taskEither.map(function (user) { return generateTokens(user.id, refreshToken); }));
}
exports.refreshToken = refreshToken;
function updateUser(id, user) {
    var name = user.name, email = user.email, password = user.password;
    return function_1.pipe(email, fp_ts_1.option.fromNullable, fp_ts_1.option.fold(function () { return fp_ts_1.taskEither.right(null); }, function (email) {
        return function_1.pipe(dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["SELECT id FROM user WHERE email = ", " AND id != ", ""], ["SELECT id FROM user WHERE email = ", " AND id != ", ""])), email, id), io_ts_1.type({ id: Types_1.PositiveInteger })), fp_ts_1.taskEither.chain(function (user) {
            return function_1.pipe(user, fp_ts_1.option.fold(function () { return fp_ts_1.taskEither.right(null); }, function () {
                return fp_ts_1.taskEither.left(Types_1.coolerError('COOLER_409', 'Duplicate user'));
            }));
        }));
    }), fp_ts_1.taskEither.chain(function () { return database_1.getUserById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'User not found'); })), fp_ts_1.taskEither.chain(function (user) {
        var args = removeUndefined_1.removeUndefined({
            name: name,
            email: email,
            password: function_1.pipe(password, fp_ts_1.option.fromNullable, fp_ts_1.option.fold(function_1.constUndefined, function (p) { return bcryptjs_1.hashSync(p, 10); }))
        });
        return database_1.updateUser(user.id, args);
    }), fp_ts_1.taskEither.chain(function () { return database_1.getUserById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'User not found'); })));
}
exports.updateUser = updateUser;
function deleteUser(id) {
    return function_1.pipe(database_1.getUserById(id), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () { return Types_1.coolerError('COOLER_404', 'User not found'); })), fp_ts_1.taskEither.chain(function (user) {
        return function_1.pipe(database_1.deleteUser(user.id), fp_ts_1.taskEither.map(function () { return user; }));
    }));
}
exports.deleteUser = deleteUser;
function getUserFromContext(context) {
    if (!ensureUser_1.isUserContext(context)) {
        return fp_ts_1.option.none;
    }
    return fp_ts_1.option.some(context.user);
}
exports.getUserFromContext = getUserFromContext;
function generateTokens(userId, oldRefreshToken) {
    var expiration = new Date(Date.now() + 86400000);
    var accessToken = jsonWebToken_1.signToken({
        type: 'ACCESS',
        id: userId
    }, {
        expiresIn: 86400
    });
    var refreshToken = oldRefreshToken ||
        jsonWebToken_1.signToken({
            type: 'REFRESH',
            id: userId
        });
    return {
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiration: expiration
    };
}
var templateObject_1, templateObject_2;
