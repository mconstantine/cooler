"use strict";
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
var interface_1 = require("./interface");
var interface_2 = require("../user/interface");
var ConnectionQueryArgs_1 = require("../misc/ConnectionQueryArgs");
var model_1 = require("./model");
var ensureUser_1 = require("../misc/ensureUser");
var Connection_1 = require("../misc/Connection");
var createResolver_1 = require("../misc/createResolver");
var Types_1 = require("../misc/Types");
var t = __importStar(require("io-ts"));
var function_1 = require("fp-ts/function");
var fp_ts_1 = require("fp-ts");
var taxUserResolver = createResolver_1.createResolver(Types_1.EmptyObject, interface_2.User, model_1.getTaxUser);
var userTaxesResolver = createResolver_1.createResolver(ConnectionQueryArgs_1.ConnectionQueryArgs, Connection_1.Connection(interface_1.Tax), model_1.getUserTaxes);
var CreateTaxMutationInput = t.type({
    tax: interface_1.TaxCreationInput
}, 'CreateTaxMutationInput');
var createTaxMutation = createResolver_1.createResolver(CreateTaxMutationInput, interface_1.Tax, function (_parent, _a, context) {
    var tax = _a.tax;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.createTax(tax, user); }));
});
var UpdateTaxMutationInput = t.type({ id: Types_1.PositiveInteger, tax: interface_1.TaxUpdateInput }, 'UpdateTaxMutationInput');
var updateTaxMutation = createResolver_1.createResolver(UpdateTaxMutationInput, interface_1.Tax, function (_parent, _a, context) {
    var id = _a.id, tax = _a.tax;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.updateTax(id, tax, user); }));
});
var DeleteTaxMutationInput = t.type({ id: Types_1.PositiveInteger }, 'DeleteTaxMutationInput');
var deleteTaxMutation = createResolver_1.createResolver(DeleteTaxMutationInput, interface_1.Tax, function (_parent, _a, context) {
    var id = _a.id;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.deleteTax(id, user); }));
});
var TaxQueryInput = t.type({ id: Types_1.PositiveInteger }, 'TaxQueryInput');
var taxQuery = createResolver_1.createResolver(TaxQueryInput, interface_1.Tax, function (_parent, _a, context) {
    var id = _a.id;
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.getTax(id, user); }));
});
var taxesQuery = createResolver_1.createResolver(ConnectionQueryArgs_1.ConnectionQueryArgs, Connection_1.Connection(interface_1.Tax), function (_parent, args, context) {
    return function_1.pipe(ensureUser_1.ensureUser(context), fp_ts_1.taskEither.chain(function (user) { return model_1.listTaxes(args, user); }));
});
var resolvers = {
    Tax: {
        user: taxUserResolver
    },
    User: {
        taxes: userTaxesResolver
    },
    Mutation: {
        createTax: createTaxMutation,
        updateTax: updateTaxMutation,
        deleteTax: deleteTaxMutation
    },
    Query: {
        tax: taxQuery,
        taxes: taxesQuery
    }
};
exports.default = resolvers;
