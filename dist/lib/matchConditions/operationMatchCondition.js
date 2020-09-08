"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ast_1 = require("../ast");
/** @hidden */
exports.default = (function (_a) {
    var _b = _a === void 0 ? {} : _a, operationNames = _b.operationNames, operationTypes = _b.operationTypes, pathRegexes = _b.pathRegexes;
    return function (_a, parents) {
        var node = _a.node;
        var operationDef = parents.find(function (_a) {
            var kind = _a.kind;
            return kind === 'OperationDefinition';
        });
        if (!operationDef)
            return false;
        if (operationNames) {
            if (!operationDef.name || !operationNames.includes(operationDef.name.value)) {
                return false;
            }
        }
        if (operationTypes && !operationTypes.includes(operationDef.operation)) {
            return false;
        }
        if (pathRegexes) {
            var pathStr_1 = ast_1.extractPath(parents.concat([node])).join('.');
            if (!pathRegexes.find(function (pathRegex) { return pathRegex.test(pathStr_1); })) {
                return false;
            }
        }
        return true;
    };
});
//# sourceMappingURL=operationMatchCondition.js.map