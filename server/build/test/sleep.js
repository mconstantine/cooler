"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = void 0;
var fp_ts_1 = require("fp-ts");
var function_1 = require("fp-ts/function");
function sleep(millis, a) {
    return function_1.pipe(fp_ts_1.taskEither.tryCatch(function () { return new Promise(function (done) { return setTimeout(done, millis); }); }, function_1.constVoid), fp_ts_1.taskEither.fold(function () { return fp_ts_1.task.fromIO(function () { return a; }); }, function () { return fp_ts_1.task.fromIO(function () { return a; }); }));
}
exports.sleep = sleep;
