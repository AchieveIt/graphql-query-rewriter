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
 * Rewriter which replaces the name of a single argument of a field
 * ex: change from thingID: ID! to thingId: ID!
 */
var FieldArgNameRewriter = /** @class */ (function (_super) {
    __extends(FieldArgNameRewriter, _super);
    function FieldArgNameRewriter(options) {
        var _this = _super.call(this, options) || this;
        _this.oldArgName = options.oldArgName;
        _this.newArgName = options.newArgName;
        return _this;
    }
    FieldArgNameRewriter.prototype.matches = function (nodeAndVars, parents) {
        var _this = this;
        if (!_super.prototype.matches.call(this, nodeAndVars, parents))
            return false;
        var node = nodeAndVars.node;
        // is this a field with the correct arguments?
        if (!node.arguments)
            return false;
        // is there an argument with the correct name?
        return !!node.arguments.find(function (arg) { return arg.name.value === _this.oldArgName; });
    };
    FieldArgNameRewriter.prototype.rewriteQuery = function (_a) {
        var _this = this;
        var node = _a.node, variableDefinitions = _a.variableDefinitions;
        var newArguments = (node.arguments || []).map(function (argument) {
            if (argument.name.value === _this.oldArgName) {
                return __assign({}, argument, { name: __assign({}, argument.name, { value: _this.newArgName }) });
            }
            return argument;
        });
        return { variableDefinitions: variableDefinitions, node: __assign({}, node, { arguments: newArguments }) };
    };
    return FieldArgNameRewriter;
}(Rewriter_1.default));
exports.default = FieldArgNameRewriter;
//# sourceMappingURL=FieldArgNameRewriter.js.map