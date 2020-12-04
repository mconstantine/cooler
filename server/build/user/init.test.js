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
var init_1 = require("../init");
var getFakeUser_1 = require("../test/getFakeUser");
var dbUtils_1 = require("../misc/dbUtils");
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var function_1 = require("fp-ts/function");
var fp_ts_1 = require("fp-ts");
var database_1 = require("./database");
var util_1 = require("../test/util");
var sleep_1 = require("../test/sleep");
describe('initUser', function () {
    describe('happy path', function () {
        beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, init_1.init()()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should create a database table', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, dbUtils_1.dbExec(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT * FROM user"], ["SELECT * FROM user"]))))()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should save the creation time automatically', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(database_1.insertUser(getFakeUser_1.getFakeUser()), fp_ts_1.taskEither.chain(function (id) { return database_1.getUserById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), util_1.testTaskEither(function (user) {
                            expect(user.created_at).toBeInstanceOf(Date);
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should keep track of the time of the last update', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(getFakeUser_1.getFakeUser(), database_1.insertUser, fp_ts_1.taskEither.chain(function (id) { return database_1.getUserById(id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), fp_ts_1.taskEither.chain(function (user) { return fp_ts_1.taskEither.fromTask(sleep_1.sleep(1000, user)); }), fp_ts_1.taskEither.chain(function (user) {
                            return function_1.pipe(database_1.updateUser(user.id, {
                                name: (user.name + ' Jr')
                            }), fp_ts_1.taskEither.chain(function () { return database_1.getUserById(user.id); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), fp_ts_1.taskEither.map(function (updatedUser) { return ({
                                before: user.updated_at,
                                after: updatedUser.updated_at
                            }); }));
                        }), util_1.testTaskEither(function (_a) {
                            var before = _a.before, after = _a.after;
                            expect(before.getTime()).not.toBe(after.getTime());
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
    });
});
var templateObject_1;
