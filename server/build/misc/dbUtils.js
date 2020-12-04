"use strict";
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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.update = exports.insert = exports.dbGetAll = exports.dbGet = exports.dbExec = exports.dbRun = void 0;
var fp_ts_1 = require("fp-ts");
var function_1 = require("fp-ts/function");
var getDatabase_1 = require("./getDatabase");
var removeUndefined_1 = require("./removeUndefined");
var Types_1 = require("./Types");
var reportDecodeErrors_1 = require("./reportDecodeErrors");
var Apply_1 = require("fp-ts/Apply");
function dbRun(sql) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return function_1.pipe(getDatabase_1.getDatabase(), fp_ts_1.taskEither.chain(function (db) {
        return fp_ts_1.taskEither.tryCatch(function () { return db.run.apply(db, __spread([sql], args)); }, function (error) {
            console.log(error);
            return Types_1.coolerError('COOLER_500', 'Unable to run statement against database');
        });
    }));
}
exports.dbRun = dbRun;
function dbExec(sql) {
    return function_1.pipe(getDatabase_1.getDatabase(), fp_ts_1.taskEither.chain(function (db) {
        return fp_ts_1.taskEither.tryCatch(function () { return db.exec(sql); }, function (error) {
            console.log(error);
            return Types_1.coolerError('COOLER_500', 'Unable to exec statement against database');
        });
    }));
}
exports.dbExec = dbExec;
function dbGet(sql, codec) {
    return function_1.pipe(getDatabase_1.getDatabase(), fp_ts_1.taskEither.chain(function (db) {
        return fp_ts_1.taskEither.tryCatch(function () { return db.get(sql); }, function (error) {
            console.log(error);
            return Types_1.coolerError('COOLER_500', 'Unable to get from database');
        });
    }), fp_ts_1.taskEither.map(fp_ts_1.option.fromNullable), fp_ts_1.taskEither.chain(function (record) {
        return fp_ts_1.taskEither.fromEither(function_1.pipe(record, fp_ts_1.option.fold(function () { return fp_ts_1.either.right(fp_ts_1.option.none); }, function_1.flow(codec.decode, reportDecodeErrors_1.reportDecodeErrors(codec.name), fp_ts_1.either.bimap(function () {
            return Types_1.coolerError('COOLER_500', 'Unable to decode record from database');
        }, fp_ts_1.option.some)))));
    }));
}
exports.dbGet = dbGet;
function dbGetAll(sql, codec) {
    return function_1.pipe(getDatabase_1.getDatabase(), fp_ts_1.taskEither.chain(function (db) {
        return fp_ts_1.taskEither.tryCatch(function () { return db.all(sql); }, function (error) {
            console.log(error);
            return Types_1.coolerError('COOLER_500', 'Unable to get from database');
        });
    }), fp_ts_1.taskEither.chain(function (records) {
        return fp_ts_1.taskEither.fromEither(function_1.pipe(records, fp_ts_1.nonEmptyArray.fromArray, fp_ts_1.option.fold(function () { return fp_ts_1.either.right([]); }, function_1.flow(fp_ts_1.nonEmptyArray.map(codec.decode), function (records) { return Apply_1.sequenceT(fp_ts_1.either.either).apply(void 0, __spread(records)); }, fp_ts_1.either.mapLeft(function () {
            return Types_1.coolerError('COOLER_500', 'Unable to decode records from database');
        })))));
    }));
}
exports.dbGetAll = dbGetAll;
function insert(tableName, _rows, codec) {
    var rows = function_1.pipe(Array.isArray(_rows) ? _rows : [_rows], function (rows) { return rows.map(removeUndefined_1.removeUndefined); }, function (rows) { return rows.map(codec.encode); });
    var columns = "`" + Object.keys(rows[0]).join('`, `') + "`";
    var values = "" + rows
        .map(function (row) { return new Array(Object.keys(row).length).fill('?').join(', '); })
        .join('), (');
    var query = "INSERT INTO " + tableName + " (" + columns + ") VALUES (" + values + ")";
    var args = rows.map(function (row) { return Object.values(row); }).flat();
    return function_1.pipe(dbRun.apply(void 0, __spread([query], args)), fp_ts_1.taskEither.map(function (_a) {
        var lastID = _a.lastID;
        return lastID;
    }));
}
exports.insert = insert;
function update(tableName, id, row, codec) {
    var encodedRow = codec.encode(row);
    var _a = __read(Object.entries(removeUndefined_1.removeUndefined(encodedRow))
        .filter(function (_a) {
        var _b = __read(_a, 1), key = _b[0];
        return key !== 'id';
    })
        .reduce(function (_a, _b) {
        var _c = __read(_a, 2), query = _c[0], args = _c[1];
        var _d = __read(_b, 2), key = _d[0], value = _d[1];
        return [
            __spread(query, ["`" + key + "` = ?"]),
            __spread(args, [value])
        ];
    }, [[], []]), 2), query = _a[0], args = _a[1];
    return function_1.pipe(dbRun.apply(void 0, __spread(["UPDATE " + tableName + " SET " + query.join(', ') + " WHERE `id` = ?"], args, [id])), fp_ts_1.taskEither.map(function (_a) {
        var changes = _a.changes;
        return changes;
    }));
}
exports.update = update;
function remove(tableName, where) {
    var query = "DELETE FROM " + tableName;
    var args = [];
    if (where && Object.keys(where).length) {
        var whereStatement = Object.keys(where)
            .map(function (key) { return "`" + key + "` = ?"; })
            .join(' AND ');
        query += " WHERE " + whereStatement;
        args = Object.values(where);
    }
    return function_1.pipe(dbRun.apply(void 0, __spread([query], args)), fp_ts_1.taskEither.map(function (_a) {
        var changes = _a.changes;
        return changes;
    }));
}
exports.remove = remove;
