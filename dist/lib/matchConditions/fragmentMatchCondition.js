"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ast_1 = require("../ast");
var fragmentMatchCondition = function (_a) {
    var _b = _a === void 0 ? {} : _a, fragmentNames = _b.fragmentNames, fragmentTypes = _b.fragmentTypes, pathRegexes = _b.pathRegexes;
    return function (_a, parents) {
        var node = _a.node;
        var fragmentDef = parents.find(function (_a) {
            var kind = _a.kind;
            return kind === 'FragmentDefinition';
        });
        if (!fragmentDef)
            return false;
        if (fragmentNames && !fragmentNames.includes(fragmentDef.name.value)) {
            return false;
        }
        if (fragmentTypes && !fragmentTypes.includes(fragmentDef.typeCondition.name.value)) {
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
};
exports.default = fragmentMatchCondition;
//# sourceMappingURL=fragmentMatchCondition.js.map