"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportDecodeErrors = void 0;
var PathReporter_1 = require("io-ts/PathReporter");
function reportDecodeErrors(origin) {
    return function (result) {
        var errors = PathReporter_1.PathReporter.report(result);
        if (errors.length > 1) {
            console.log("Decoding error from " + origin);
            errors.map(function (error) { return console.error(error); });
        }
        return result;
    };
}
exports.reportDecodeErrors = reportDecodeErrors;
