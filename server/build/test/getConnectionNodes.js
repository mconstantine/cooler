"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnectionNodes = void 0;
function getConnectionNodes(connection) {
    return connection.edges.map(function (_a) {
        var node = _a.node;
        return node;
    });
}
exports.getConnectionNodes = getConnectionNodes;
