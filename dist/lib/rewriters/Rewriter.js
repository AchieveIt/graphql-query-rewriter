"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Abstract base Rewriter class
 * Extend this class and overwrite its methods to create a new rewriter
 */
var Rewriter = /** @class */ (function () {
    function Rewriter(_a) {
        var fieldName = _a.fieldName, rootTypes = _a.rootTypes, matchConditions = _a.matchConditions;
        this.rootTypes = ['query', 'mutation', 'fragment'];
        this.fieldName = fieldName;
        this.matchConditions = matchConditions;
        if (rootTypes)
            this.rootTypes = rootTypes;
    }
    Rewriter.prototype.matches = function (nodeAndVarDefs, parents) {
        var node = nodeAndVarDefs.node;
        if (node.kind !== 'Field' || node.name.value !== this.fieldName)
            return false;
        var root = parents[0];
        if (root.kind === 'OperationDefinition' &&
            this.rootTypes.indexOf(root.operation) === -1) {
            return false;
        }
        if (root.kind === 'FragmentDefinition' && this.rootTypes.indexOf('fragment') === -1) {
            return false;
        }
        if (this.matchConditions &&
            !this.matchConditions.find(function (condition) { return condition(nodeAndVarDefs, parents); })) {
            return false;
        }
        return true;
    };
    Rewriter.prototype.rewriteQuery = function (nodeAndVarDefs) {
        return nodeAndVarDefs;
    };
    Rewriter.prototype.rewriteVariables = function (nodeAndVarDefs, variables) {
        return variables;
    };
    Rewriter.prototype.rewriteResponse = function (response, key) {
        return response;
    };
    return Rewriter;
}());
exports.default = Rewriter;
//# sourceMappingURL=Rewriter.js.map