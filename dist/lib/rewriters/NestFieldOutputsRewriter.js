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
var Rewriter_1 = require("./Rewriter");
/**
 * Rewriter which nests output fields inside of a new output object
 * ex: change from `field { output1, output2 }` to `field { nestedOutputs { output1, output 2 } }`
 */
var NestFieldOutputsRewriter = /** @class */ (function (_super) {
    __extends(NestFieldOutputsRewriter, _super);
    function NestFieldOutputsRewriter(options) {
        var _this = _super.call(this, options) || this;
        _this.newOutputName = options.newOutputName;
        _this.outputsToNest = options.outputsToNest;
        return _this;
    }
    NestFieldOutputsRewriter.prototype.matches = function (nodeAndVars, parents) {
        var _this = this;
        if (!_super.prototype.matches.call(this, nodeAndVars, parents))
            return false;
        var node = nodeAndVars.node;
        // is this a field with the correct selections?
        if (!node.selectionSet)
            return false;
        // if `newOutputName` already exists as an output, skip it
        if (node.selectionSet.selections.find(function (output) { return output.kind === 'Field' && output.name.value === _this.newOutputName; })) {
            return false;
        }
        // is there an output with a matching name?
        return !!node.selectionSet.selections.find(function (output) { return output.kind === 'Field' && _this.outputsToNest.indexOf(output.name.value) >= 0; });
    };
    NestFieldOutputsRewriter.prototype.rewriteQuery = function (nodeAndVarDefs) {
        var _this = this;
        var node = nodeAndVarDefs.node;
        var variableDefinitions = nodeAndVarDefs.variableDefinitions;
        if (!node.selectionSet)
            return nodeAndVarDefs;
        var outputsToNest = (node.selectionSet.selections || []).filter(function (output) { return output.kind === 'Field' && _this.outputsToNest.indexOf(output.name.value) >= 0; });
        var newOutputs = (node.selectionSet.selections || []).filter(function (output) { return output.kind === 'Field' && _this.outputsToNest.indexOf(output.name.value) === -1; });
        var nestedOutput = {
            kind: 'Field',
            name: { kind: 'Name', value: this.newOutputName },
            selectionSet: {
                kind: 'SelectionSet',
                selections: outputsToNest
            }
        };
        newOutputs.push(nestedOutput);
        return {
            variableDefinitions: variableDefinitions,
            node: __assign({}, node, { selectionSet: __assign({}, node.selectionSet, { selections: newOutputs }) })
        };
    };
    NestFieldOutputsRewriter.prototype.rewriteResponse = function (response, key) {
        var pathResponse = response[key];
        if (typeof pathResponse === 'object') {
            // undo the nesting in the response so it matches the original query
            if (pathResponse[this.newOutputName] &&
                typeof pathResponse[this.newOutputName] === 'object') {
                var rewrittenResponse = __assign({}, pathResponse, pathResponse[this.newOutputName]);
                delete rewrittenResponse[this.newOutputName];
                response[key] = rewrittenResponse;
            }
        }
        return response;
    };
    return NestFieldOutputsRewriter;
}(Rewriter_1.default));
exports.default = NestFieldOutputsRewriter;
//# sourceMappingURL=NestFieldOutputsRewriter.js.map