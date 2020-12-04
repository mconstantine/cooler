"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.merge = void 0;
var Types_1 = require("./Types");
function merge() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var target = {};
    var merger = function (source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                var obj = source;
                if (Types_1.isObject(obj[key])) {
                    target[key] = merge(target[key], obj[key]);
                }
                else {
                    target[key] = obj[key];
                }
            }
        }
    };
    args.forEach(function (arg) { return merger(arg); });
    return target;
}
exports.merge = merge;
