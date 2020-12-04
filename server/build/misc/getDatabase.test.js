"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('sqlite');
var fp_ts_1 = require("fp-ts");
var function_1 = require("fp-ts/function");
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var sqlite_1 = require("sqlite");
var util_1 = require("../test/util");
var getDatabase_1 = require("./getDatabase");
var actualOpen = jest.requireActual('sqlite').open;
sqlite_1.open.mockImplementation(function (config) {
    return actualOpen(config);
});
describe('getDatabase', function () {
    it('should cache the database', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, getDatabase_1.getDatabase()()];
                case 1:
                    _a.sent();
                    expect(sqlite_1.open).toHaveBeenCalledTimes(1);
                    return [4, getDatabase_1.getDatabase()()];
                case 2:
                    _a.sent();
                    expect(sqlite_1.open).toHaveBeenCalledTimes(1);
                    return [2];
            }
        });
    }); });
    it('should return a working database', function () { return __awaiter(void 0, void 0, void 0, function () {
        var createTable, testQuery;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expect.assertions(1);
                    createTable = function (db) {
                        return fp_ts_1.taskEither.tryCatch(function () {
                            return db.exec(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n            CREATE TABLE IF NOT EXISTS getDatabase (\n              id INTEGER PRIMARY KEY,\n              key TEXT NOT NULL,\n              value TEXT NOT NULL\n            )\n          "], ["\n            CREATE TABLE IF NOT EXISTS getDatabase (\n              id INTEGER PRIMARY KEY,\n              key TEXT NOT NULL,\n              value TEXT NOT NULL\n            )\n          "]))));
                        }, function (error) {
                            console.log(error);
                            return new Error('Unable to create table');
                        });
                    };
                    testQuery = function (db) {
                        return fp_ts_1.taskEither.tryCatch(function () {
                            return db.all(sql_template_strings_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["SELECT * FROM getDatabase"], ["SELECT * FROM getDatabase"]))));
                        }, function (error) {
                            console.log(error);
                            return new Error('Unable to query database');
                        });
                    };
                    return [4, function_1.pipe(getDatabase_1.getDatabase(), fp_ts_1.taskEither.chain(function (db) {
                            return function_1.pipe(createTable(db), fp_ts_1.taskEither.chain(function () { return testQuery(db); }));
                        }), util_1.testTaskEither(function (test) { return expect(test).toEqual([]); }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
var templateObject_1, templateObject_2;
