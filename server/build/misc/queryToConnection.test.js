"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var queryToConnection_1 = require("./queryToConnection");
var function_1 = require("fp-ts/function");
var t = __importStar(require("io-ts"));
var dbUtils_1 = require("./dbUtils");
var fp_ts_1 = require("fp-ts");
var Types_1 = require("./Types");
var io_ts_types_1 = require("io-ts-types");
var getDatabase_1 = require("./getDatabase");
var util_1 = require("../test/util");
var getConnectionNodes_1 = require("../test/getConnectionNodes");
describe('queryToConnection', function () {
    describe('usage', function () {
        var Data = t.type({
            id: Types_1.PositiveInteger,
            char: t.string,
            number: t.number
        }, 'Data');
        var DataInput = t.type({
            char: t.string,
            number: t.number
        }, 'DataInput');
        var data = [];
        beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            var dataInput, _loop_1, dataInput_1, dataInput_1_1, input, e_1_1;
            var e_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        dataInput = [
                            {
                                char: 'A',
                                number: 4
                            },
                            {
                                char: 'C',
                                number: 3
                            },
                            {
                                char: 'B',
                                number: 2
                            },
                            {
                                char: 'D',
                                number: 1
                            }
                        ];
                        return [4, dbUtils_1.dbExec(sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n        CREATE TABLE IF NOT EXISTS queryToConnectionUsage (\n          id INTEGER PRIMARY KEY,\n          char TEXT NOT NULL,\n          number INTEGER NOT NULL\n        )\n      "], ["\n        CREATE TABLE IF NOT EXISTS queryToConnectionUsage (\n          id INTEGER PRIMARY KEY,\n          char TEXT NOT NULL,\n          number INTEGER NOT NULL\n        )\n      "]))))()];
                    case 1:
                        _b.sent();
                        _loop_1 = function (input) {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4, function_1.pipe(dbUtils_1.insert('queryToConnectionUsage', input, DataInput), fp_ts_1.taskEither.map(function (id) {
                                            data.push(__assign(__assign({}, input), { id: id }));
                                        }))()];
                                    case 1:
                                        _a.sent();
                                        return [2];
                                }
                            });
                        };
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 7, 8, 9]);
                        dataInput_1 = __values(dataInput), dataInput_1_1 = dataInput_1.next();
                        _b.label = 3;
                    case 3:
                        if (!!dataInput_1_1.done) return [3, 6];
                        input = dataInput_1_1.value;
                        return [5, _loop_1(input)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        dataInput_1_1 = dataInput_1.next();
                        return [3, 3];
                    case 6: return [3, 9];
                    case 7:
                        e_1_1 = _b.sent();
                        e_1 = { error: e_1_1 };
                        return [3, 9];
                    case 8:
                        try {
                            if (dataInput_1_1 && !dataInput_1_1.done && (_a = dataInput_1.return)) _a.call(dataInput_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7];
                    case 9:
                        expect(data).toEqual([
                            { id: 1, char: 'A', number: 4 },
                            { id: 2, char: 'C', number: 3 },
                            { id: 3, char: 'B', number: 2 },
                            { id: 4, char: 'D', number: 1 }
                        ]);
                        return [2];
                }
            });
        }); });
        afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, dbUtils_1.dbExec(sql_template_strings_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["DROP TABLE queryToConnectionUsage"], ["DROP TABLE queryToConnectionUsage"]))))()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(queryToConnection_1.queryToConnection({}, ['id', 'char', 'number'], 'queryToConnectionUsage', Data), util_1.testTaskEither(function (result) {
                            expect(result.totalCount).toBe(4);
                            expect(result.edges.length).toBe(4);
                            expect(getConnectionNodes_1.getConnectionNodes(result)).toEqual(data);
                            var startCursor = result.edges[0].cursor;
                            var endCursor = result.edges[3].cursor;
                            expect(result.pageInfo.startCursor).toEqual(fp_ts_1.option.some(startCursor));
                            expect(result.pageInfo.endCursor).toEqual(fp_ts_1.option.some(endCursor));
                            expect(result.pageInfo.hasNextPage).toBe(false);
                            expect(result.pageInfo.hasPreviousPage).toBe(false);
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should handle "first" and "after" (two per page)', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(queryToConnection_1.queryToConnection({
                            first: 2,
                            after: queryToConnection_1.toCursor(3),
                            orderBy: 'number ASC'
                        }, ['id', 'char', 'number'], 'queryToConnectionUsage', Data), util_1.testTaskEither(function (result) {
                            expect(result.totalCount).toBe(4);
                            expect(result.edges.length).toBe(2);
                            expect(getConnectionNodes_1.getConnectionNodes(result)).toEqual([data[1], data[0]]);
                            expect(result.pageInfo.startCursor).toEqual(fp_ts_1.option.some(queryToConnection_1.toCursor(2)));
                            expect(result.pageInfo.endCursor).toEqual(fp_ts_1.option.some(queryToConnection_1.toCursor(1)));
                            expect(result.pageInfo.hasNextPage).toBe(false);
                            expect(result.pageInfo.hasPreviousPage).toBe(true);
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should handle "first" and "after" (one per page)', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(queryToConnection_1.queryToConnection({
                            first: 1,
                            after: queryToConnection_1.toCursor(3),
                            orderBy: 'number ASC'
                        }, ['id', 'char', 'number'], 'queryToConnectionUsage', Data), util_1.testTaskEither(function (result) {
                            expect(result.totalCount).toBe(4);
                            expect(result.edges.length).toBe(1);
                            expect(getConnectionNodes_1.getConnectionNodes(result)).toEqual([data[1]]);
                            expect(result.pageInfo.startCursor).toEqual(fp_ts_1.option.some(queryToConnection_1.toCursor(2)));
                            expect(result.pageInfo.endCursor).toEqual(fp_ts_1.option.some(queryToConnection_1.toCursor(2)));
                            expect(result.pageInfo.hasNextPage).toBe(true);
                            expect(result.pageInfo.hasPreviousPage).toBe(true);
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should handle "last" and "before" (one per page)', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(queryToConnection_1.queryToConnection({
                            last: 1,
                            before: queryToConnection_1.toCursor(2),
                            orderBy: 'char ASC'
                        }, ['id', 'char', 'number'], 'queryToConnectionUsage', Data, sql_template_strings_1.default(templateObject_3 || (templateObject_3 = __makeTemplateObject(["WHERE char != ", ""], ["WHERE char != ", ""])), 'D')), util_1.testTaskEither(function (result) {
                            expect(result.totalCount).toBe(3);
                            expect(result.edges.length).toBe(1);
                            expect(getConnectionNodes_1.getConnectionNodes(result)).toEqual([data[2]]);
                            expect(result.pageInfo.startCursor).toEqual(fp_ts_1.option.some(queryToConnection_1.toCursor(3)));
                            expect(result.pageInfo.endCursor).toEqual(fp_ts_1.option.some(queryToConnection_1.toCursor(3)));
                            expect(result.pageInfo.hasNextPage).toBe(true);
                            expect(result.pageInfo.hasPreviousPage).toBe(true);
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should handle "last" and "before" (two per page)', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(queryToConnection_1.queryToConnection({
                            last: 2,
                            before: queryToConnection_1.toCursor(2),
                            orderBy: 'char ASC'
                        }, ['id', 'char', 'number'], 'queryToConnectionUsage', Data, sql_template_strings_1.default(templateObject_4 || (templateObject_4 = __makeTemplateObject(["WHERE char != ", ""], ["WHERE char != ", ""])), 'D')), util_1.testTaskEither(function (result) {
                            expect(result.totalCount).toBe(3);
                            expect(result.edges.length).toBe(2);
                            expect(getConnectionNodes_1.getConnectionNodes(result)).toEqual([data[0], data[2]]);
                            expect(result.pageInfo.startCursor).toEqual(fp_ts_1.option.some(queryToConnection_1.toCursor(1)));
                            expect(result.pageInfo.endCursor).toEqual(fp_ts_1.option.some(queryToConnection_1.toCursor(3)));
                            expect(result.pageInfo.hasNextPage).toBe(true);
                            expect(result.pageInfo.hasPreviousPage).toBe(false);
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should handle empty results', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(queryToConnection_1.queryToConnection({}, ['id', 'char', 'number'], 'queryToConnectionUsage', Data, sql_template_strings_1.default(templateObject_5 || (templateObject_5 = __makeTemplateObject(["WHERE char = ", ""], ["WHERE char = ", ""])), 'Z')), util_1.testTaskEither(function (result) {
                            expect(result.totalCount).toBe(0);
                            expect(result.edges.length).toBe(0);
                            expect(result.pageInfo.startCursor).toEqual(fp_ts_1.option.none);
                            expect(result.pageInfo.endCursor).toEqual(fp_ts_1.option.none);
                            expect(result.pageInfo.hasNextPage).toBe(false);
                            expect(result.pageInfo.hasPreviousPage).toBe(false);
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
    });
    describe('data encoding', function () {
        var Data = t.type({
            id: Types_1.PositiveInteger,
            content: io_ts_types_1.optionFromNullable(t.string)
        }, 'Data');
        var DataInput = t.type({
            content: io_ts_types_1.optionFromNullable(t.string)
        }, 'DataInput');
        beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, dbUtils_1.dbExec(sql_template_strings_1.default(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n        CREATE TABLE queryToConnectionEncoding (\n          id INTEGER PRIMARY KEY,\n          content TEXT\n        )\n      "], ["\n        CREATE TABLE queryToConnectionEncoding (\n          id INTEGER PRIMARY KEY,\n          content TEXT\n        )\n      "]))))()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, dbUtils_1.dbExec(sql_template_strings_1.default(templateObject_7 || (templateObject_7 = __makeTemplateObject(["DROP TABLE queryToConnectionEncoding"], ["DROP TABLE queryToConnectionEncoding"]))))()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
            var row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        row = {
                            content: fp_ts_1.option.none
                        };
                        return [4, function_1.pipe(dbUtils_1.insert('queryToConnectionEncoding', row, DataInput), fp_ts_1.taskEither.chain(function (id) {
                                return function_1.pipe(getDatabase_1.getDatabase(), fp_ts_1.taskEither.chain(function (db) {
                                    return fp_ts_1.taskEither.tryCatch(function () {
                                        return db.get(sql_template_strings_1.default(templateObject_8 || (templateObject_8 = __makeTemplateObject(["SELECT * FROM queryToConnectionEncoding WHERE id = ", ""], ["SELECT * FROM queryToConnectionEncoding WHERE id = ", ""])), id));
                                    }, util_1.testError);
                                }));
                            }), util_1.testTaskEither(function (result) {
                                expect(result === null || result === void 0 ? void 0 : result.content).toBeNull();
                            }))];
                    case 1:
                        _a.sent();
                        return [4, function_1.pipe(queryToConnection_1.queryToConnection({}, ['*'], 'queryToConnectionEncoding', Data), util_1.testTaskEither(function (result) {
                                expect(result.edges[0].node.content).toEqual(fp_ts_1.option.none);
                            }))];
                    case 2:
                        _a.sent();
                        return [2];
                }
            });
        }); });
    });
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
