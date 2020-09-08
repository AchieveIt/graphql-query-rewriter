"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var operationMatchCondition_1 = require("./operationMatchCondition");
var mutationMatchCondition = function (_a) {
    var _b = _a === void 0 ? {} : _a, mutationNames = _b.mutationNames, pathRegexes = _b.pathRegexes;
    return operationMatchCondition_1.default({
        pathRegexes: pathRegexes,
        operationNames: mutationNames,
        operationTypes: ['mutation']
    });
};
exports.default = mutationMatchCondition;
//# sourceMappingURL=mutationMatchCondition.js.map