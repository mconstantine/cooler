"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectUpdateInput = exports.ProjectCreationInput = exports.DatabaseProject = exports.Project = exports.PlainProject = void 0;
var fp_ts_1 = require("fp-ts");
var function_1 = require("fp-ts/function");
var Apply_1 = require("fp-ts/Apply");
var t = __importStar(require("io-ts"));
var io_ts_types_1 = require("io-ts-types");
var Types_1 = require("../misc/Types");
var CashData = t.type({
    at: io_ts_types_1.DateFromISOString,
    balance: Types_1.NonNegativeNumber
});
var DatabaseCashData = t.type({
    at: Types_1.DateFromSQLDate,
    balance: Types_1.NonNegativeNumber
});
exports.PlainProject = t.type({
    id: t.number,
    name: t.string,
    description: t.union([t.string, t.null]),
    client: t.number,
    cashed_at: t.union([t.string, t.null]),
    cashed_balance: t.union([t.number, t.null]),
    created_at: t.string,
    updated_at: t.string
}, 'PlainProject');
var ProjectMiddleware = t.type({
    id: Types_1.PositiveInteger,
    name: io_ts_types_1.NonEmptyString,
    description: io_ts_types_1.optionFromNullable(io_ts_types_1.NonEmptyString),
    client: Types_1.PositiveInteger,
    cashed_at: io_ts_types_1.optionFromNullable(io_ts_types_1.DateFromISOString),
    cashed_balance: io_ts_types_1.optionFromNullable(Types_1.NonNegativeNumber),
    created_at: io_ts_types_1.DateFromISOString,
    updated_at: io_ts_types_1.DateFromISOString
}, 'ProjectMiddleware');
var DatabaseProjectMiddleware = t.type({
    id: Types_1.PositiveInteger,
    name: io_ts_types_1.NonEmptyString,
    description: io_ts_types_1.optionFromNullable(io_ts_types_1.NonEmptyString),
    client: Types_1.PositiveInteger,
    user: Types_1.PositiveInteger,
    cashed_at: io_ts_types_1.optionFromNullable(io_ts_types_1.DateFromISOString),
    cashed_balance: io_ts_types_1.optionFromNullable(Types_1.NonNegativeNumber),
    created_at: io_ts_types_1.DateFromISOString,
    updated_at: io_ts_types_1.DateFromISOString
}, 'DatabaseProjectMiddleware');
var Projectish = t.type({
    id: Types_1.PositiveInteger,
    name: io_ts_types_1.NonEmptyString,
    description: io_ts_types_1.option(io_ts_types_1.NonEmptyString),
    client: Types_1.PositiveInteger,
    created_at: t.unknown,
    updated_at: t.unknown,
    cashed: t.unknown
}, 'Projectish');
var DatabaseProjectish = t.type({
    id: Types_1.PositiveInteger,
    name: io_ts_types_1.NonEmptyString,
    description: io_ts_types_1.option(io_ts_types_1.NonEmptyString),
    client: Types_1.PositiveInteger,
    user: Types_1.PositiveInteger,
    created_at: t.unknown,
    updated_at: t.unknown,
    cashed: t.unknown
}, 'Projectish');
exports.Project = new t.Type('Project', function (u) {
    return Projectish.is(u) &&
        io_ts_types_1.option(CashData).is(u.cashed) &&
        io_ts_types_1.DateFromISOString.is(u.created_at) &&
        io_ts_types_1.DateFromISOString.is(u.updated_at);
}, function (u, c) {
    return function_1.pipe(ProjectMiddleware.validate(u, c), fp_ts_1.either.chain(function (u) {
        return function_1.pipe(Apply_1.sequenceS(fp_ts_1.option.option)({
            at: u.cashed_at,
            balance: u.cashed_balance
        }), fp_ts_1.option.fold(function () {
            return t.success({
                id: u.id,
                name: u.name,
                description: u.description,
                client: u.client,
                cashed: fp_ts_1.option.none,
                created_at: u.created_at,
                updated_at: u.updated_at
            });
        }, function (cashed) {
            return t.success({
                id: u.id,
                name: u.name,
                description: u.description,
                client: u.client,
                cashed: fp_ts_1.option.some(cashed),
                created_at: u.created_at,
                updated_at: u.updated_at
            });
        }));
    }));
}, function (project) {
    return function_1.pipe({
        id: project.id,
        name: project.name,
        description: project.description,
        client: project.client,
        cashed_at: function_1.pipe(project.cashed, fp_ts_1.option.map(function (_a) {
            var at = _a.at;
            return at;
        })),
        cashed_balance: function_1.pipe(project.cashed, fp_ts_1.option.map(function (_a) {
            var balance = _a.balance;
            return balance;
        })),
        created_at: project.created_at,
        updated_at: project.updated_at
    }, ProjectMiddleware.encode);
});
exports.DatabaseProject = new t.Type('DatabaseProject', function (u) {
    return DatabaseProjectish.is(u) &&
        io_ts_types_1.option(CashData).is(u.cashed) &&
        Types_1.DateFromSQLDate.is(u.created_at) &&
        Types_1.DateFromSQLDate.is(u.updated_at);
}, function (u, c) {
    return function_1.pipe(DatabaseProjectMiddleware.validate(u, c), fp_ts_1.either.chain(function (u) {
        return function_1.pipe(Apply_1.sequenceS(fp_ts_1.option.option)({
            at: u.cashed_at,
            balance: u.cashed_balance
        }), fp_ts_1.option.fold(function () {
            return t.success({
                id: u.id,
                name: u.name,
                description: u.description,
                client: u.client,
                user: u.user,
                cashed: fp_ts_1.option.none,
                created_at: u.created_at,
                updated_at: u.updated_at
            });
        }, function (cashed) {
            return t.success({
                id: u.id,
                name: u.name,
                description: u.description,
                client: u.client,
                user: u.user,
                cashed: fp_ts_1.option.some(cashed),
                created_at: u.created_at,
                updated_at: u.updated_at
            });
        }));
    }));
}, function (project) {
    return function_1.pipe({
        id: project.id,
        name: project.name,
        description: project.description,
        client: project.client,
        user: project.user,
        cashed_at: function_1.pipe(project.cashed, fp_ts_1.option.map(function (_a) {
            var at = _a.at;
            return at;
        })),
        cashed_balance: function_1.pipe(project.cashed, fp_ts_1.option.map(function (_a) {
            var balance = _a.balance;
            return balance;
        })),
        created_at: project.created_at,
        updated_at: project.updated_at
    }, DatabaseProjectMiddleware.encode);
});
var ProjectCreationInputMiddleware = t.type({
    name: io_ts_types_1.NonEmptyString,
    description: io_ts_types_1.optionFromNullable(io_ts_types_1.NonEmptyString),
    client: Types_1.PositiveInteger,
    cashed_at: io_ts_types_1.optionFromNullable(Types_1.DateFromSQLDate),
    cashed_balance: io_ts_types_1.optionFromNullable(Types_1.NonNegativeNumber)
}, 'ProjectCreationInputMiddleware');
var ProjectCreationInputish = t.type({
    name: io_ts_types_1.NonEmptyString,
    description: io_ts_types_1.optionFromNullable(io_ts_types_1.NonEmptyString),
    client: Types_1.PositiveInteger,
    cashed: t.UnknownRecord
}, 'ProjectCreationInputish');
exports.ProjectCreationInput = new t.Type('ProjectCreationInput', function (u) {
    return ProjectCreationInputish.is(u) && io_ts_types_1.option(CashData).is(u.cashed);
}, function (u, c) {
    return function_1.pipe(ProjectCreationInputMiddleware.validate(u, c), fp_ts_1.either.chain(function (u) {
        return function_1.pipe(Apply_1.sequenceS(fp_ts_1.option.option)({
            at: u.cashed_at,
            balance: u.cashed_balance
        }), fp_ts_1.option.fold(function () {
            return t.success({
                name: u.name,
                description: u.description,
                client: u.client,
                cashed: fp_ts_1.option.none
            });
        }, function (cashed) {
            return t.success({
                name: u.name,
                description: u.description,
                client: u.client,
                cashed: fp_ts_1.option.some(cashed)
            });
        }));
    }));
}, function (project) {
    return function_1.pipe({
        name: project.name,
        description: project.description,
        client: project.client,
        cashed_at: function_1.pipe(project.cashed, fp_ts_1.option.map(function (_a) {
            var at = _a.at;
            return at;
        })),
        cashed_balance: function_1.pipe(project.cashed, fp_ts_1.option.map(function (_a) {
            var balance = _a.balance;
            return balance;
        }))
    }, ProjectCreationInputMiddleware.encode);
});
var ProjectUpdateInputMiddleware = t.partial({
    name: io_ts_types_1.NonEmptyString,
    description: io_ts_types_1.optionFromNullable(io_ts_types_1.NonEmptyString),
    client: Types_1.PositiveInteger,
    cashed_at: io_ts_types_1.optionFromNullable(Types_1.DateFromSQLDate),
    cashed_balance: io_ts_types_1.optionFromNullable(Types_1.NonNegativeNumber)
}, 'ProjectUpdateInputMiddleware');
var ProjectUpdateInputish = t.partial({
    name: io_ts_types_1.NonEmptyString,
    description: io_ts_types_1.optionFromNullable(io_ts_types_1.NonEmptyString),
    client: Types_1.PositiveInteger,
    cashed: t.UnknownRecord
}, 'ProjectUpdateInputish');
exports.ProjectUpdateInput = new t.Type('ProjectUpdateInput', function (u) {
    return ProjectUpdateInputish.is(u) && io_ts_types_1.option(DatabaseCashData).is(u.cashed);
}, function (u, c) {
    return function_1.pipe(ProjectUpdateInputMiddleware.validate(u, c), fp_ts_1.either.chain(function (u) {
        return function_1.pipe(u.cashed_at === undefined && u.cashed_balance === undefined, fp_ts_1.boolean.fold(function () {
            return function_1.pipe(Apply_1.sequenceS(fp_ts_1.option.option)({
                at: u.cashed_at,
                balance: u.cashed_balance
            }), fp_ts_1.option.fold(function () {
                return t.success({
                    name: u.name,
                    description: u.description,
                    client: u.client,
                    cashed: fp_ts_1.option.none
                });
            }, function (cashed) {
                return t.success({
                    name: u.name,
                    description: u.description,
                    client: u.client,
                    cashed: fp_ts_1.option.some(cashed)
                });
            }));
        }, function () {
            return t.success({
                name: u.name,
                description: u.description,
                client: u.client
            });
        }));
    }));
}, function (project) {
    return function_1.pipe(__assign({ name: project.name, description: project.description, client: project.client }, function_1.pipe(project.cashed === undefined, fp_ts_1.boolean.fold(function () { return ({
        cashed_at: function_1.pipe(project.cashed, fp_ts_1.option.map(function (_a) {
            var at = _a.at;
            return at;
        })),
        cashed_balance: function_1.pipe(project.cashed, fp_ts_1.option.map(function (_a) {
            var balance = _a.balance;
            return balance;
        }))
    }); }, function () { return ({}); }))), ProjectUpdateInputMiddleware.encode);
});
