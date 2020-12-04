"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
var init_1 = __importDefault(require("./user/init"));
var init_2 = __importDefault(require("./client/init"));
var init_3 = __importDefault(require("./project/init"));
var init_4 = __importDefault(require("./task/init"));
var init_5 = __importDefault(require("./session/init"));
var init_6 = __importDefault(require("./tax/init"));
var function_1 = require("fp-ts/function");
var fp_ts_1 = require("fp-ts");
var getDatabase_1 = require("./misc/getDatabase");
var Types_1 = require("./misc/Types");
function init() {
    return function_1.pipe(init_1.default(), fp_ts_1.taskEither.chain(init_2.default), fp_ts_1.taskEither.chain(init_3.default), fp_ts_1.taskEither.chain(init_4.default), fp_ts_1.taskEither.chain(init_5.default), fp_ts_1.taskEither.chain(init_6.default), fp_ts_1.taskEither.chain(getDatabase_1.getDatabase), fp_ts_1.taskEither.chain(function (db) {
        return fp_ts_1.taskEither.tryCatch(function () { return db.migrate(); }, function (error) {
            console.log(error);
            return Types_1.coolerError('COOLER_500', 'Unable to perform database migrations');
        });
    }));
}
exports.init = init;
