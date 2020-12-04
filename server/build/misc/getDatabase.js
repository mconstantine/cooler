"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabase = void 0;
var sqlite3_1 = require("sqlite3");
var sqlite_1 = require("sqlite");
var path_1 = __importDefault(require("path"));
var function_1 = require("fp-ts/function");
var fp_ts_1 = require("fp-ts");
var Types_1 = require("./Types");
var database = fp_ts_1.option.none;
function getDatabase() {
    return function_1.pipe(database, fp_ts_1.option.fold(function () {
        return function_1.pipe(fp_ts_1.taskEither.tryCatch(function () {
            return sqlite_1.open({
                filename: process.env.NODE_ENV === 'test'
                    ? ':memory:'
                    : path_1.default.join(process.cwd(), 'data.db'),
                driver: sqlite3_1.cached.Database
            });
        }, function (error) {
            console.log(error);
            return Types_1.coolerError('COOLER_500', 'Unable to access database');
        }), fp_ts_1.taskEither.map(function (db) {
            database = fp_ts_1.option.some(db);
            return db;
        }));
    }, function (database) { return fp_ts_1.taskEither.fromIO(function () { return database; }); }));
}
exports.getDatabase = getDatabase;
