"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var operationMatchCondition_1 = require("./operationMatchCondition");
var queryMatchCondition = function (_a) {
    var _b = _a === void 0 ? {} : _a, queryNames = _b.queryNames, pathRegexes = _b.pathRegexes;
    return operationMatchCondition_1.default({
        pathRegexes: pathRegexes,
        operationNames: queryNames,
        operationTypes: ['query']
    });
};
exports.default = queryMatchCondition;
//# sourceMappingURL=queryMatchCondition.js.map