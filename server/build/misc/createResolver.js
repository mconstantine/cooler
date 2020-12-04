"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResolver = void 0;
var fp_ts_1 = require("fp-ts");
var function_1 = require("fp-ts/function");
var Types_1 = require("./Types");
function createResolver(argsCodec, resultCodec, resolve) {
    return function (parent, args, context) {
        return function_1.pipe(args, argsCodec.decode, fp_ts_1.either.mapLeft(function (error) {
            return Types_1.coolerError('COOLER_400', 'Invalid parameters format', error);
        }), fp_ts_1.taskEither.fromEither, fp_ts_1.taskEither.chain(function (args) { return resolve(parent, args, context); }), function (taskEither) { return taskEither(); }, function (promise) {
            return promise.then(fp_ts_1.either.fold(function (error) { return Promise.reject(error); }, function (result) { return Promise.resolve(function_1.pipe(result, resultCodec.encode)); }));
        });
    };
}
exports.createResolver = createResolver;
