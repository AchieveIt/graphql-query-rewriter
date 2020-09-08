"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var ast_1 = require("../ast");
var utils_1 = require("../utils");
var Rewriter_1 = require("./Rewriter");
/**
 * Rewriter which replaces the type of a single argument of a field
 * ex: change from id: String! to id: ID!
 */
var FieldArgTypeRewriter = /** @class */ (function (_super) {
    __extends(FieldArgTypeRewriter, _super);
    function FieldArgTypeRewriter(options) {
        var _this = _super.call(this, options) || this;
        _this.argName = options.argName;
        _this.oldTypeNode = graphql_1.parseType(options.oldType);
        _this.newTypeNode = graphql_1.parseType(options.newType);
        _this.coerceVariable = options.coerceVariable || utils_1.identifyFunc;
        return _this;
    }
    FieldArgTypeRewriter.prototype.matches = function (nodeAndVars, parents) {
        var _this = this;
        if (!_super.prototype.matches.call(this, nodeAndVars, parents))
            return false;
        var node = nodeAndVars.node;
        var variableDefinitions = nodeAndVars.variableDefinitions;
        // is this a field with the correct fieldName and arguments?
        if (node.kind !== 'Field')
            return false;
        if (node.name.value !== this.fieldName || !node.arguments)
            return false;
        // is there an argument with the correct name and type in a variable?
        var matchingArgument = node.arguments.find(function (arg) { return arg.name.value === _this.argName; });
        if (!matchingArgument || matchingArgument.value.kind !== 'Variable')
            return false;
        var varRef = matchingArgument.value.name.value;
        // does the referenced variable have the correct type?
        for (var _i = 0, variableDefinitions_1 = variableDefinitions; _i < variableDefinitions_1.length; _i++) {
            var varDefinition = variableDefinitions_1[_i];
            if (varDefinition.variable.name.value === varRef) {
                return ast_1.nodesMatch(this.oldTypeNode, varDefinition.type);
            }
        }
        return false;
    };
    FieldArgTypeRewriter.prototype.rewriteQuery = function (_a) {
        var _this = this;
        var node = _a.node, variableDefinitions = _a.variableDefinitions;
        var varRefName = this.extractMatchingVarRefName(node);
        var newVarDefs = variableDefinitions.map(function (varDef) {
            if (varDef.variable.name.value !== varRefName)
                return varDef;
            return __assign({}, varDef, { type: _this.newTypeNode });
        });
        return { node: node, variableDefinitions: newVarDefs };
    };
    FieldArgTypeRewriter.prototype.rewriteVariables = function (_a, variables) {
        var node = _a.node;
        var _b;
        if (!variables)
            return variables;
        var varRefName = this.extractMatchingVarRefName(node);
        return __assign({}, variables, (_b = {}, _b[varRefName] = this.coerceVariable(variables[varRefName]), _b));
    };
    FieldArgTypeRewriter.prototype.extractMatchingVarRefName = function (node) {
        var _this = this;
        var matchingArgument = (node.arguments || []).find(function (arg) { return arg.name.value === _this.argName; });
        return matchingArgument.value.name.value;
    };
    return FieldArgTypeRewriter;
}(Rewriter_1.default));
exports.default = FieldArgTypeRewriter;
//# sourceMappingURL=FieldArgTypeRewriter.js.map