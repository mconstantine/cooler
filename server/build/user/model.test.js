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
var fp_ts_1 = require("fp-ts");
var function_1 = require("fp-ts/function");
var init_1 = require("../init");
var dbUtils_1 = require("../misc/dbUtils");
var Types_1 = require("../misc/Types");
var getFakeUser_1 = require("../test/getFakeUser");
var util_1 = require("../test/util");
var database_1 = require("./database");
var interface_1 = require("./interface");
var model_1 = require("./model");
describe('userModel', function () {
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    process.env.SECRET = 'shhhhh';
                    return [4, init_1.init()()];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    afterAll(function () {
        delete process.env.SECRET;
    });
    describe('createUser', function () {
        afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, dbUtils_1.remove('user')()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(model_1.createUser(getFakeUser_1.getFakeUser(), {}), util_1.testTaskEither(function (token) {
                            expect(interface_1.AccessTokenResponse.is(token)).toBe(true);
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should encrypt password', function () { return __awaiter(void 0, void 0, void 0, function () {
            var input;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        input = getFakeUser_1.getFakeUser();
                        return [4, function_1.pipe(model_1.createUser(input, {}), fp_ts_1.taskEither.chain(function () { return database_1.getUserByEmail(input.email); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), util_1.testTaskEither(function (user) {
                                expect(user.password).not.toBe(input.password);
                            }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it("should not allow anonymous registration unless it's the first user ever", function () { return __awaiter(void 0, void 0, void 0, function () {
            var input;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        input = getFakeUser_1.getFakeUser();
                        return [4, function_1.pipe(model_1.createUser(input, {}), fp_ts_1.taskEither.chain(function () { return model_1.createUser(getFakeUser_1.getFakeUser(), {}); }), util_1.testTaskEitherError(function (error) {
                                expect(error.extensions.code).toBe('COOLER_403');
                            }))];
                    case 1:
                        _a.sent();
                        return [4, function_1.pipe(database_1.getUserByEmail(input.email), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), fp_ts_1.taskEither.chain(function (user) { return model_1.createUser(getFakeUser_1.getFakeUser(), { user: user }); }), util_1.testTaskEither(function (token) {
                                expect(interface_1.AccessTokenResponse.is(token)).toBe(true);
                            }))];
                    case 2:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should keep emails unique', function () { return __awaiter(void 0, void 0, void 0, function () {
            var input;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        input = getFakeUser_1.getFakeUser();
                        return [4, function_1.pipe(model_1.createUser(input, {}), fp_ts_1.taskEither.chain(function () { return database_1.getUserByEmail(input.email); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), fp_ts_1.taskEither.chain(function (user) {
                                return model_1.createUser(getFakeUser_1.getFakeUser({ email: input.email }), { user: user });
                            }), util_1.testTaskEitherError(function (error) {
                                expect(error.extensions.code).toBe('COOLER_409');
                            }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
    });
    describe('loginUser', function () {
        var user = getFakeUser_1.getFakeUser();
        beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, model_1.createUser(user, {})()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, dbUtils_1.remove('user', { email: user.email })()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(model_1.loginUser({
                            email: user.email,
                            password: user.password
                        }), util_1.testTaskEither(function (token) {
                            expect(interface_1.AccessTokenResponse.is(token)).toBe(true);
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should fail if email is wrong', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(model_1.loginUser({
                            email: ('not-' + user.email),
                            password: user.password
                        }), util_1.testTaskEitherError(function (error) {
                            expect(error.extensions.code).toBe('COOLER_404');
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should fail if password is wrong', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(model_1.loginUser({
                            email: user.email,
                            password: (user.password + 'not')
                        }), util_1.testTaskEitherError(function (error) {
                            expect(error.extensions.code).toBe('COOLER_400');
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
    });
    describe('refreskToken', function () {
        var user = getFakeUser_1.getFakeUser();
        var response;
        beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(model_1.createUser(user, {}), util_1.testTaskEither(function (result) {
                            response = result;
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, dbUtils_1.remove('user')()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(model_1.refreshToken({
                            refreshToken: response.refreshToken
                        }), util_1.testTaskEither(function (token) {
                            expect(interface_1.AccessTokenResponse.is(token)).toBe(true);
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should fail if token is invalid', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(model_1.refreshToken({
                            refreshToken: 'fake'
                        }), util_1.testTaskEitherError(function (error) {
                            expect(error.extensions.code).toBe('COOLER_400');
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should fail if token is of the wrong type', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(model_1.refreshToken({
                            refreshToken: response.accessToken
                        }), util_1.testTaskEitherError(function (error) {
                            expect(error.extensions.code).toBe('COOLER_400');
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
    });
    describe('updateUser', function () {
        var user = getFakeUser_1.getFakeUser();
        beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, model_1.createUser(user, {})()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, dbUtils_1.remove('user', { email: user.email })()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(database_1.getUserByEmail(user.email), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), fp_ts_1.taskEither.chain(function (user) {
                            return model_1.updateUser(user.id, {
                                name: (user.name + ' Jr')
                            });
                        }), util_1.testTaskEither(function (updatedUser) {
                            expect(interface_1.User.is(updatedUser)).toBe(true);
                            expect(updatedUser.name).toBe(user.name + ' Jr');
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should keep emails unique', function () { return __awaiter(void 0, void 0, void 0, function () {
            var user2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        user2 = getFakeUser_1.getFakeUser();
                        return [4, function_1.pipe(database_1.getUserByEmail(user.email), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), fp_ts_1.taskEither.chain(function (user) {
                                return function_1.pipe(model_1.createUser(user2, { user: user }), fp_ts_1.taskEither.chain(function () {
                                    return model_1.updateUser(user.id, {
                                        email: user2.email
                                    });
                                }));
                            }), util_1.pipeTestTaskEitherError(function (error) {
                                expect(error.extensions.code).toBe('COOLER_409');
                            }), fp_ts_1.taskEither.chain(function () { return dbUtils_1.remove('user', { email: user2.email }); }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
    });
    describe('deleteUser', function () {
        var user = getFakeUser_1.getFakeUser();
        beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, model_1.createUser(user, {})()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, dbUtils_1.remove('user', {})()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
        it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, function_1.pipe(database_1.getUserByEmail(user.email), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(util_1.testError)), fp_ts_1.taskEither.chain(function (user) { return model_1.deleteUser(user.id); }), util_1.pipeTestTaskEither(function (deletedUser) {
                            expect(deletedUser.email).toBe(user.email);
                        }), fp_ts_1.taskEither.chain(function () { return database_1.getUserByEmail(user.email); }), fp_ts_1.taskEither.chain(fp_ts_1.taskEither.fromOption(function () {
                            return Types_1.coolerError('COOLER_404', 'This should happen');
                        })), util_1.testTaskEitherError(function (error) {
                            expect(error.message).toBe('This should happen');
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); });
    });
});
