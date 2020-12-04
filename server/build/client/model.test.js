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
var getFakeUser_1 = require("../test/getFakeUser");
var getFakeClient_1 = require("../test/getFakeClient");
var model_1 = require("./model");
var interface_1 = require("./interface");
var init_1 = require("../init");
var function_1 = require("fp-ts/function");
var fp_ts_1 = require("fp-ts");
var registerUser_1 = require("../test/registerUser");
var util_1 = require("../test/util");
var Apply_1 = require("fp-ts/Apply");
var dbUtils_1 = require("../misc/dbUtils");
var getConnectionNodes_1 = require("../test/getConnectionNodes");
var user1;
var user2;
var client1;
var client2;
beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                process.env.SECRET = 'shhhhh';
                return [4, init_1.init()()];
            case 1:
                _a.sent();
                return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                        u1: registerUser_1.registerUser(getFakeUser_1.getFakeUser()),
                        u2: registerUser_1.registerUser(getFakeUser_1.getFakeUser())
                    }), util_1.testTaskEither(function (_a) {
                        var u1 = _a.u1, u2 = _a.u2;
                        user1 = u1;
                        user2 = u2;
                    }))];
            case 2:
                _a.sent();
                return [4, function_1.pipe(Apply_1.sequenceS(fp_ts_1.taskEither.taskEither)({
                        c1: model_1.createClient(getFakeClient_1.getFakeClient(user1.id), user1),
                        c2: model_1.createClient(getFakeClient_1.getFakeClient(user2.id), user2)
                    }), util_1.testTaskEither(function (_a) {
                        var c1 = _a.c1, c2 = _a.c2;
                        client1 = c1;
                        client2 = c2;
                    }))];
            case 3:
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
                return [4, dbUtils_1.remove('user')()];
            case 1:
                _a.sent();
                return [2];
        }
    });
}); });
describe('createClient', function () {
    it('should set the user automatically', function () { return __awaiter(void 0, void 0, void 0, function () {
        var client;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = getFakeClient_1.getFakeClient(user2.id);
                    return [4, function_1.pipe(model_1.createClient(client, user1), util_1.testTaskEither(function (result) {
                            expect(client.user).toBe(user2.id);
                            expect(result.user).toBe(user1.id);
                        }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('getClient', function () {
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.getClient(client1.id, user1), util_1.testTaskEither(function (client) {
                        expect(client).toMatchObject(client1);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it("should not allow users to see other users' clients", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.getClient(client2.id, user1), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('listClients', function () {
    it("should list only the user's clients", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.listClients({ name: fp_ts_1.option.none }, user1), util_1.testTaskEither(function (connection) {
                        var clients = getConnectionNodes_1.getConnectionNodes(connection);
                        expect(clients).toContainEqual(expect.objectContaining({ id: client1.id }));
                        expect(clients).not.toContainEqual(expect.objectContaining({ id: client2.id }));
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('updateClient', function () {
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = getFakeClient_1.getFakeClient(user1.id);
                    return [4, function_1.pipe(model_1.updateClient(client1.id, data, user1), util_1.testTaskEither(function (client) {
                            expect(client).toMatchObject(data);
                            client1 = client;
                        }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it("should not allow users to update other users' clients", function () { return __awaiter(void 0, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = getFakeClient_1.getFakeClient(user2.id);
                    return [4, function_1.pipe(model_1.updateClient(client1.id, data, user1), util_1.testTaskEitherError(function (error) {
                            expect(error.extensions.code).toBe('COOLER_403');
                        }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should switch from a BUSINESS to a PRIVATE client correctly', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(getFakeClient_1.getFakeClient(user1.id, { type: 'BUSINESS' }), function (client) { return model_1.createClient(client, user1); }, fp_ts_1.taskEither.chain(interface_1.foldClient(function () { return fp_ts_1.taskEither.left(util_1.testError()); }, function (client) { return fp_ts_1.taskEither.right(client); })), util_1.pipeTestTaskEither(function (client) {
                        expect(client.country_code).not.toBe(null);
                        expect(client.vat_number).not.toBe(null);
                        expect(client.business_name).not.toBe(null);
                    }), fp_ts_1.taskEither.chain(function (_a) {
                        var id = _a.id;
                        return function_1.pipe(getFakeClient_1.getFakeClient(user1.id, { type: 'PRIVATE' }), function (client) { return model_1.updateClient(id, client, user1); }, fp_ts_1.taskEither.chain(interface_1.foldClient(function (client) { return fp_ts_1.taskEither.right(client); }, function () { return fp_ts_1.taskEither.left(util_1.testError()); })));
                    }), util_1.testTaskEither(function (client) {
                        expect(client.fiscal_code).not.toBe(null);
                        expect(client.first_name).not.toBe(null);
                        expect(client.last_name).not.toBe(null);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should switch from a PRIVATE to a BUSINESS client correctly', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(getFakeClient_1.getFakeClient(user1.id, { type: 'PRIVATE' }), function (client) { return model_1.createClient(client, user1); }, fp_ts_1.taskEither.chain(interface_1.foldClient(function (client) { return fp_ts_1.taskEither.right(client); }, function () { return fp_ts_1.taskEither.left(util_1.testError()); })), util_1.pipeTestTaskEither(function (client) {
                        expect(client.fiscal_code).not.toBe(null);
                        expect(client.first_name).not.toBe(null);
                        expect(client.last_name).not.toBe(null);
                    }), fp_ts_1.taskEither.chain(function (_a) {
                        var id = _a.id;
                        return function_1.pipe(getFakeClient_1.getFakeClient(user1.id, { type: 'BUSINESS' }), function (client) { return model_1.updateClient(id, client, user1); }, fp_ts_1.taskEither.chain(interface_1.foldClient(function () { return fp_ts_1.taskEither.left(util_1.testError()); }, function (client) { return fp_ts_1.taskEither.right(client); })));
                    }), util_1.testTaskEither(function (client) {
                        expect(client.country_code).not.toBe(null);
                        expect(client.vat_number).not.toBe(null);
                        expect(client.business_name).not.toBe(null);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
describe('deleteClient', function () {
    var client1;
    var client2;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.createClient(getFakeClient_1.getFakeClient(user1.id), user1), util_1.testTaskEither(function (client) {
                        client1 = client;
                    }))];
                case 1:
                    _a.sent();
                    return [4, function_1.pipe(model_1.createClient(getFakeClient_1.getFakeClient(user2.id), user2), util_1.testTaskEither(function (client) {
                            client2 = client;
                        }))];
                case 2:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.deleteClient(client1.id, user1), util_1.testTaskEither(function (client) {
                        expect(client).toMatchObject(client1);
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it("should not allow users to delete other users' clients", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, function_1.pipe(model_1.deleteClient(client2.id, user1), util_1.testTaskEitherError(function (error) {
                        expect(error.extensions.code).toBe('COOLER_403');
                    }))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
