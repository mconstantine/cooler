"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var init_1 = require("../init");
var getFakeUser_1 = require("../test/getFakeUser");
var getFakeTax_1 = require("../test/getFakeTax");
var model_1 = require("./model");
var interface_1 = require("./interface");
var function_1 = require("fp-ts/function");
var fp_ts_1 = require("fp-ts");
var util_1 = require("../test/util");
var dbUtils_1 = require("../misc/dbUtils");
var registerUser_1 = require("../test/registerUser");
var Apply_1 = require("fp-ts/Apply");
var database_1 = require("./database");
var getConnectionNodes_1 = require("../test/getConnectionNodes");
var user1;
var user2;
var tax1;
var tax2;
beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                process.env.SECRET = 'shhhhh';
                return [4, function_1.pipe(init_1.init(), util_1.testTaskEither(function_1.constVoid))];
            case 1:
                _a.sent();
                return [4, function_1.pipe(registerUser_1.registerUser(getFakeUser_1.getFakeUser()), util_1.pipeTestTaskEither(function (u) {
                        user1 = u;
                    }), util_1.testTaskEither(function_1.constVoid))];
            case 2:
                _a.sent();
                return [4, function_1.pipe(registerUser_1.registerUser(getFakeUser_1.getFakeUser(), user1), util_1.pipeTestTaskEither(function (u) {
                        user2 = u;
                    }), util_1.testTaskEither(function_1.constVoid))];
            case 3:
                _a.sent();
                return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                        t1: function_1.pipe(database_1.insertTax(getFakeTax_1.getFakeTax(user1.id)), fp_ts_1.taskEither.chain(database_1.getTaxById), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError))),
                        t2: function_1.pipe(database_1.insertTax(getFakeTax_1.getFakeTax(user2.id)), fp_ts_1.taskEither.chain(database_1.getTaxById), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)))
                    }), util_1.pipeTestTaskEither(function (_a) {
                        var t1 = _a.t1, t2 = _a.t2;
                        tax1 = t1;
                        tax2 = t2;
                    }), util_1.testTaskEither(function_1.constVoid))];
            case 4:
                _a.sent();
                return [2];
        }
    });
}); });
afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                delete process.env.SECRET;
                return [4, function_1.pipe(dbUtils_1.remove('user'), util_1.testTaskEither(function_1.constVoid))];
            case 1:
                _a.sent();
                return [2];
        }
    });
}); });
describe('createTax', function () {
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.createTax(getFakeTax_1.getFakeTax(user1.id), user1), util_1.testTaskEither(function (tax) {
                        expect(interface_1.Tax.is(tax)).toBe(true);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should force the user from the request', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.createTax(getFakeTax_1.getFakeTax(user2.id), user1), util_1.testTaskEither(function (tax) {
                        expect(tax.user).toBe(user1.id);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('getTax', function () {
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.getTax(tax1.id, user1), util_1.testTaskEither(function (tax) {
                        expect(tax).toMatchObject(tax1);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should not allow users to see taxes of other users', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.getTax(tax1.id, user2), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('listTaxes', function () {
    it("should list all and only the user's taxes", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.listTaxes({}, user1), util_1.testTaskEither(function (connection) {
                        var taxes = getConnectionNodes_1.getConnectionNodes(connection);
                        expect(taxes).toContainEqual(tax1);
                        expect(taxes).not.toContainEqual(tax2);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('updateTax', function () {
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        var input;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    input = getFakeTax_1.getFakeTax(user2.id);
                    return [4, function_1.pipe(model_1.updateTax(tax2.id, input, user2), util_1.testTaskEither(function (tax) {
                            expect(interface_1.Tax.is(tax)).toBe(true);
                            expect(tax).toMatchObject(input);
                            tax2 = tax;
                        }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should not allow users to update taxes of other users', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.updateTax(tax1.id, getFakeTax_1.getFakeTax(user2.id), user2), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('deleteTax', function () {
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        var input;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    input = getFakeTax_1.getFakeTax(user1.id);
                    return [4, function_1.pipe(database_1.insertTax(input), fp_ts_1.taskEither.chain(function (taxId) { return model_1.deleteTax(taxId, user1); }), util_1.pipeTestTaskEither(function (tax) {
                            expect(tax).toMatchObject(input);
                        }), fp_ts_1.taskEither.chain(function (tax) { return database_1.getTaxById(tax.id); }), util_1.testTaskEither(function (tax) {
                            expect(fp_ts_1.option.isNone(tax)).toBe(true);
                        }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should not allow users to delete taxes of other users', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(database_1.insertTax(getFakeTax_1.getFakeTax(user1.id)), fp_ts_1.taskEither.chain(function (taxId) { return model_1.deleteTax(taxId, user2); }), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
