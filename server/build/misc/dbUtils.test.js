"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
var fp_ts_1 = require("fp-ts");
var function_1 = require("fp-ts/function");
var t = __importStar(require("io-ts"));
var io_ts_types_1 = require("io-ts-types");
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var util_1 = require("../test/util");
var dbUtils_1 = require("./dbUtils");
var Types_1 = require("./Types");
var Row = t.type({
    id: Types_1.PositiveInteger,
    key: t.string,
    value: t.string,
    optional: io_ts_types_1.optionFromNullable(t.string)
}, 'Row');
var RowInput = t.type({
    key: t.string,
    value: t.string,
    optional: io_ts_types_1.optionFromNullable(t.string)
}, 'RowInput');
var RowUpateInput = t.partial({
    key: t.string,
    value: t.string,
    optional: io_ts_types_1.optionFromNullable(t.string)
}, 'RowUpateInput');
describe('dbUtils', function () {
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, dbUtils_1.dbExec(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      CREATE TABLE IF NOT EXISTS dbUtils (\n        id INTEGER PRIMARY KEY,\n        key TEXT NOT NULL,\n        value TEXT NOT NULL,\n        optional TEXT\n      )\n    "], ["\n      CREATE TABLE IF NOT EXISTS dbUtils (\n        id INTEGER PRIMARY KEY,\n        key TEXT NOT NULL,\n        value TEXT NOT NULL,\n        optional TEXT\n      )\n    "]))))()];
                case 1:
                    _a.sent();
                    return [4, dbUtils_1.dbExec(sql_template_strings_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      INSERT INTO dbUtils (\n        key, value\n      ) VALUES (\n        \"one\", \"1\"\n      ), (\n        \"two\", \"2\"\n      ), (\n        \"three\", \"3\"\n      )\n    "], ["\n      INSERT INTO dbUtils (\n        key, value\n      ) VALUES (\n        \"one\", \"1\"\n      ), (\n        \"two\", \"2\"\n      ), (\n        \"three\", \"3\"\n      )\n    "]))))()];
                case 2:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, dbUtils_1.dbExec(sql_template_strings_1.default(templateObject_3 || (templateObject_3 = __makeTemplateObject(["DROP TABLE dbUtils"], ["DROP TABLE dbUtils"]))))()];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    describe('dbGet', function () {
        it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_4 || (templateObject_4 = __makeTemplateObject(["SELECT * FROM dbUtils WHERE key = \"one\""], ["SELECT * FROM dbUtils WHERE key = \"one\""]))), Row), util_1.testTaskEither(function (row) {
                            expect(fp_ts_1.option.isSome(row)).toBe(true);
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
    });
    describe('dbAll', function () {
        it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(dbUtils_1.dbGetAll(sql_template_strings_1.default(templateObject_5 || (templateObject_5 = __makeTemplateObject(["SELECT * FROM dbUtils"], ["SELECT * FROM dbUtils"]))), Row), util_1.testTaskEither(function (rows) {
                            expect(rows.length).toBeGreaterThan(0);
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
    });
    describe('insert and remove', function () {
        it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        data = {
                            key: 'seven',
                            value: '7',
                            optional: fp_ts_1.option.none
                        };
                        return [4, function_1.pipe(dbUtils_1.insert('dbUtils', data, RowInput), util_1.pipeTestTaskEither(function (lastID) {
                                expect(typeof lastID).toBe('number');
                                expect(lastID).toBeGreaterThan(0);
                            }), fp_ts_1.taskEither.chain(function (lastID) { return dbUtils_1.remove('dbUtils', { id: lastID }); }), util_1.testTaskEither(function (changes) {
                                expect(changes).toBe(1);
                            }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should handle multiple rows', function () { return __awaiter(void 0, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        data = [
                            {
                                key: 'sixty',
                                value: '42',
                                optional: fp_ts_1.option.none
                            },
                            {
                                key: 'eighty',
                                value: '42',
                                optional: fp_ts_1.option.none
                            }
                        ];
                        return [4, function_1.pipe(dbUtils_1.insert('dbUtils', data, RowInput), fp_ts_1.taskEither.chain(function () { return dbUtils_1.remove('dbUtils', { value: '42' }); }), util_1.testTaskEither(function (changes) {
                                expect(changes).toBe(2);
                            }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should remove keys with undefined value', function () { return __awaiter(void 0, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        data = [
                            {
                                key: 'twenty',
                                value: '20',
                                optional: fp_ts_1.option.none
                            },
                            {
                                key: 'twentyone',
                                value: '20',
                                optional: fp_ts_1.option.none
                            }
                        ];
                        return [4, function_1.pipe(dbUtils_1.insert('dbUtils', data, RowInput), fp_ts_1.taskEither.chain(function () {
                                return dbUtils_1.dbGetAll(sql_template_strings_1.default(templateObject_6 || (templateObject_6 = __makeTemplateObject(["SELECT * FROM dbUtils WHERE value = \"20\""], ["SELECT * FROM dbUtils WHERE value = \"20\""]))), Row);
                            }), util_1.pipeTestTaskEither(function (rows) {
                                expect(rows.length).toBe(2);
                                expect(rows).toContainEqual(expect.objectContaining({ optional: fp_ts_1.option.none }));
                            }), fp_ts_1.taskEither.chain(function () { return dbUtils_1.remove('dbUtils', { value: '20' }); }), util_1.testTaskEither(function (changes) {
                                expect(changes).toBe(2);
                            }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
    });
    describe('update', function () {
        it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        data = {
                            key: 'thirty',
                            value: '30',
                            optional: fp_ts_1.option.none
                        };
                        return [4, function_1.pipe(dbUtils_1.insert('dbUtils', data, RowInput), util_1.pipeTestTaskEither(function (lastID) {
                                expect(lastID).toBeGreaterThan(0);
                            }), fp_ts_1.taskEither.chain(function (lastID) {
                                return function_1.pipe(dbUtils_1.update('dbUtils', lastID, { key: 'thirty', value: '32' }, RowUpateInput), util_1.pipeTestTaskEither(function (changes) {
                                    expect(changes).toBe(1);
                                }), fp_ts_1.taskEither.chain(function () {
                                    return dbUtils_1.dbGet(sql_template_strings_1.default(templateObject_7 || (templateObject_7 = __makeTemplateObject(["SELECT * FROM dbUtils WHERE id = ", ""], ["SELECT * FROM dbUtils WHERE id = ", ""])), lastID), Row);
                                }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), util_1.pipeTestTaskEither(function (result) {
                                    expect(result.value).toBe('32');
                                }), fp_ts_1.taskEither.chain(function () { return dbUtils_1.remove('dbUtils', { value: '32' }); }));
                            }), util_1.testTaskEither(function (changes) {
                                expect(changes).toBe(1);
                            }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
    });
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
