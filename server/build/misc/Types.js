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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isObject = exports.optionFromUndefined = exports.optionFromNull = exports.coolerError = exports.EmptyObject = exports.Percentage = exports.NonNegativeNumber = exports.EmailString = exports.NonNegativeInteger = exports.PositiveInteger = exports.DateFromSQLDate = void 0;
var function_1 = require("fp-ts/function");
var t = __importStar(require("io-ts"));
var io_ts_types_1 = require("io-ts-types");
var fp_ts_1 = require("fp-ts");
var isemail_1 = require("isemail");
var apollo_server_express_1 = require("apollo-server-express");
var sqlDatePattern = /^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})$/;
exports.DateFromSQLDate = new t.Type('DateFromSQLDate', io_ts_types_1.date.is, function (u, c) {
    return function_1.pipe(t.string.validate(u, c), fp_ts_1.either.chain(function (s) {
        if (!sqlDatePattern.test(s)) {
            return t.failure(u, c);
        }
        var _a = __read(s
            .match(sqlDatePattern)
            .map(function (s) { return parseInt(s); }), 7), year = _a[1], month = _a[2], day = _a[3], hours = _a[4], minutes = _a[5], seconds = _a[6];
        return t.success(new Date(year, month - 1, day, hours, minutes, seconds));
    }));
}, function (date) {
    var leadZero = function (n) { return (n < 10 ? '0' : '') + n; };
    var year = date.getFullYear();
    var month = leadZero(date.getMonth() + 1);
    var day = leadZero(date.getDate());
    var hours = leadZero(date.getHours());
    var minutes = leadZero(date.getMinutes());
    var seconds = leadZero(date.getSeconds());
    return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
});
exports.PositiveInteger = t.brand(t.Int, function (n) { return n > 0; }, 'PositiveInteger');
exports.NonNegativeInteger = t.union([exports.PositiveInteger, t.literal(0)], 'NonNegativeInteger');
exports.EmailString = t.brand(t.string, function (s) { return isemail_1.validate(s); }, 'EmailString');
exports.NonNegativeNumber = t.brand(t.number, function (n) { return n >= 0; }, 'NonNegativeNumber');
exports.Percentage = t.brand(t.number, function (n) { return n >= 0 && n <= 1; }, 'Percentage');
exports.EmptyObject = t.type({});
var CoolerErrorType = t.keyof({
    COOLER_400: true,
    COOLER_401: true,
    COOLER_403: true,
    COOLER_404: true,
    COOLER_409: true,
    COOLER_500: true
});
function coolerError(type, message, extras) {
    return new apollo_server_express_1.ApolloError(message, type, extras);
}
exports.coolerError = coolerError;
function optionFromNull(codec, name) {
    if (name === void 0) { name = "Option<" + codec.name + ">"; }
    return new t.Type(name, io_ts_types_1.option(codec).is, function (u, c) {
        return u === null
            ? t.success(fp_ts_1.option.none)
            : function_1.pipe(codec.validate(u, c), fp_ts_1.either.map(fp_ts_1.option.some));
    }, function (a) { return function_1.pipe(a, fp_ts_1.option.map(codec.encode), fp_ts_1.option.toNullable); });
}
exports.optionFromNull = optionFromNull;
function optionFromUndefined(codec, name) {
    if (name === void 0) { name = "Option<" + codec.name + ">"; }
    return new t.Type(name, io_ts_types_1.option(codec).is, function (u, c) {
        return u === undefined
            ? t.success(fp_ts_1.option.none)
            : function_1.pipe(codec.validate(u, c), fp_ts_1.either.map(fp_ts_1.option.some));
    }, function (a) { return function_1.pipe(a, fp_ts_1.option.map(codec.encode), fp_ts_1.option.toUndefined); });
}
exports.optionFromUndefined = optionFromUndefined;
function isObject(u) {
    return Object.prototype.toString.call(u) === '[object Object]';
}
exports.isObject = isObject;
