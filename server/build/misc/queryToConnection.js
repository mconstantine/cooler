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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCursor = exports.queryToConnection = void 0;
var sql_template_strings_1 = __importDefault(require("sql-template-strings"));
var Types_1 = require("./Types");
var fp_ts_1 = require("fp-ts");
var function_1 = require("fp-ts/function");
var dbUtils_1 = require("./dbUtils");
var t = __importStar(require("io-ts"));
var ConnectionAddendum = t.type({
    _n: Types_1.NonNegativeInteger,
    _first: Types_1.NonNegativeInteger,
    _last: Types_1.NonNegativeInteger,
    totalCount: Types_1.NonNegativeInteger
}, 'ConnectionAddendum');
function queryToConnection(args, select, from, codec, rest) {
    if ((args.first && args.before) || (args.last && args.after)) {
        return fp_ts_1.taskEither.left(Types_1.coolerError('COOLER_400', 'You must use either "first" and "after" or "last" and "before". You cannot mix and match them'));
    }
    var orderBy = args.orderBy ? from + "." + args.orderBy : from + ".id ASC";
    var query = sql_template_strings_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject([""], [""]))).append("\n    WITH preset AS (\n      SELECT " + select.join(', ') + ", ROW_NUMBER() OVER(\n        ORDER BY " + orderBy + "\n      ) AS _n\n      FROM " + from + "\n  ");
    rest && query.append(rest);
    query.append("\n      ORDER BY " + orderBy + "\n    ),\n    totalCount AS (\n      SELECT COUNT(_n) AS count FROM preset\n    ),\n    firstId AS (\n      SELECT id FROM preset WHERE _n = 1\n    ),\n    lastId AS (\n      SELECT id FROM preset WHERE _n = (SELECT MAX(_n) FROM preset)\n    )\n    SELECT preset.*, firstId.id AS _first, lastId.id AS _last, totalCount.count AS totalCount\n    FROM preset, firstId, lastId, totalCount\n  ");
    if (args.after) {
        query.append("\n      WHERE _n > (SELECT _n FROM preset WHERE id = " + fromCursor(args.after) + ")\n    ");
    }
    else if (args.before) {
        query.append("\n      WHERE _n < (SELECT _n FROM preset WHERE id = " + fromCursor(args.before) + ")\n      ORDER BY _n DESC\n    ");
    }
    if (args.first) {
        query.append("\n      LIMIT " + args.first + "\n    ");
    }
    else if (args.last) {
        query.append("\n      LIMIT " + args.last + "\n    ");
    }
    return function_1.pipe(dbUtils_1.dbGetAll(query, t.intersection([codec, ConnectionAddendum])), fp_ts_1.taskEither.map(function_1.flow(fp_ts_1.nonEmptyArray.fromArray, fp_ts_1.option.fold(function () { return ({
        totalCount: 0,
        edges: [],
        pageInfo: {
            startCursor: fp_ts_1.option.none,
            endCursor: fp_ts_1.option.none,
            hasPreviousPage: false,
            hasNextPage: false
        }
    }); }, function (records) {
        args.before && records.reverse();
        var firstResult = records[0];
        var lastResult = records[records.length - 1];
        return {
            totalCount: firstResult.totalCount,
            edges: records.map(function (record) { return ({
                node: Object.entries(record)
                    .filter(function (_a) {
                    var _b = __read(_a, 1), key = _b[0];
                    return !['_n', '_first', '_last', 'totalCount'].includes(key);
                })
                    .reduce(function (res, _a) {
                    var _b;
                    var _c = __read(_a, 2), key = _c[0], value = _c[1];
                    return (__assign(__assign({}, res), (_b = {}, _b[key] = value, _b)));
                }, {}),
                cursor: toCursor(record.id)
            }); }),
            pageInfo: {
                startCursor: fp_ts_1.option.some(toCursor(firstResult.id)),
                endCursor: fp_ts_1.option.some(toCursor(lastResult.id)),
                hasPreviousPage: firstResult.id !== firstResult._first,
                hasNextPage: lastResult.id !== firstResult._last
            }
        };
    }))));
}
exports.queryToConnection = queryToConnection;
function toCursor(value) {
    return Buffer.from(value.toString(10)).toString('base64');
}
exports.toCursor = toCursor;
function fromCursor(cursor) {
    return parseInt(Buffer.from(cursor, 'base64').toString('ascii'), 10);
}
var templateObject_1;
