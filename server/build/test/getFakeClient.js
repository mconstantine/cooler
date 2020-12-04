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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFakeClient = void 0;
var faker_1 = __importDefault(require("faker"));
var fp_ts_1 = require("fp-ts");
var function_1 = require("fp-ts/function");
var interface_1 = require("../client/interface");
function getFakeClient(user, data) {
    if (data === void 0) { data = {}; }
    var type = data.type || faker_1.default.random.arrayElement(Object.values(interface_1.ClientType));
    var country_code = faker_1.default.address.countryCode();
    var commonData = {
        user: user,
        address_country: country_code,
        address_province: country_code !== 'IT'
            ? 'EE'
            : faker_1.default.random.arrayElement(Object.keys(interface_1.Province)),
        address_city: faker_1.default.address.city(),
        address_zip: faker_1.default.address.zipCode(),
        address_street: faker_1.default.address.streetName(),
        address_street_number: fp_ts_1.option.some((1 + Math.round(Math.random() * 199)).toString(10)),
        address_email: faker_1.default.internet.email()
    };
    return function_1.pipe(type === 'BUSINESS', fp_ts_1.boolean.fold(function () { return (__assign(__assign(__assign({}, commonData), data), { type: 'PRIVATE', fiscal_code: generateFiscalCode(), first_name: faker_1.default.name.firstName(), last_name: faker_1.default.name.lastName() })); }, function () { return (__assign(__assign({}, commonData), { type: 'BUSINESS', country_code: country_code, vat_number: faker_1.default.finance.mask(11), business_name: faker_1.default.company.companyName() })); }));
}
exports.getFakeClient = getFakeClient;
function generateFiscalCode() {
    var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var numbers = '1234567890';
    var format = 'aaaaaaddaddaddda';
    return format
        .split('')
        .map(function (char) {
        var target = (char === 'a' ? letters : numbers).split('');
        return target[Math.round(Math.random() * (target.length - 1))];
    })
        .join('');
}
