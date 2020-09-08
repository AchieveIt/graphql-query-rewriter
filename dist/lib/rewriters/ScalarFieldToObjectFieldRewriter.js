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
 * ex: change from `field { subField }` to `field { subField { objectfield } }`
 */
var ScalarFieldToObjectFieldRewriter = /** @class */ (function (_super) {
    __extends(ScalarFieldToObjectFieldRewriter, _super);
    function ScalarFieldToObjectFieldRewriter(options) {
        var _this = _super.call(this, options) || this;
        _this.objectFieldName = options.objectFieldName;
        return _this;
    }
    ScalarFieldToObjectFieldRewriter.prototype.matches = function (nodeAndVars, parents) {
        if (!_super.prototype.matches.call(this, nodeAndVars, parents))
            return false;
        var node = nodeAndVars.node;
        // make sure there's no subselections on this field
        if (node.selectionSet)
            return false;
        return true;
    };
    ScalarFieldToObjectFieldRewriter.prototype.rewriteQuery = function (nodeAndVarDefs) {
        var node = nodeAndVarDefs.node;
        var variableDefinitions = nodeAndVarDefs.variableDefinitions;
        // if there's a subselection already, just return
        if (node.selectionSet)
            return nodeAndVarDefs;
        var selectionSet = {
            kind: 'SelectionSet',
            selections: [
                {
                    kind: 'Field',
                    name: { kind: 'Name', value: this.objectFieldName }
                }
            ]
        };
        return {
            variableDefinitions: variableDefinitions,
            node: __assign({}, node, { selectionSet: selectionSet })
        };
    };
    ScalarFieldToObjectFieldRewriter.prototype.rewriteResponse = function (response, key) {
        if (typeof response === 'object') {
            var pathResponse = response[key];
            // undo the nesting in the response so it matches the original query
            response[key] = pathResponse[this.objectFieldName];
        }
        return response;
    };
    return ScalarFieldToObjectFieldRewriter;
}(Rewriter_1.default));
exports.default = ScalarFieldToObjectFieldRewriter;
//# sourceMappingURL=ScalarFieldToObjectFieldRewriter.js.map