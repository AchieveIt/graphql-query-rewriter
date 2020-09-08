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
 * Rewriter which replaces the args to a field with an input type
 * ex: change from field(id: $id, arg2: $arg2) to field(input: { id: $id, arg2: $arg2 })
 */
var FieldArgsToInputTypeRewriter = /** @class */ (function (_super) {
    __extends(FieldArgsToInputTypeRewriter, _super);
    function FieldArgsToInputTypeRewriter(options) {
        var _this = _super.call(this, options) || this;
        _this.inputArgName = 'input';
        _this.fieldName = options.fieldName;
        _this.argNames = options.argNames;
        if (options.inputArgName)
            _this.inputArgName = options.inputArgName;
        return _this;
    }
    FieldArgsToInputTypeRewriter.prototype.matches = function (nodeAndVars, parents) {
        var _this = this;
        if (!_super.prototype.matches.call(this, nodeAndVars, parents))
            return false;
        var node = nodeAndVars.node;
        // is this a field with the correct fieldName and arguments?
        if (node.name.value !== this.fieldName || !node.arguments)
            return false;
        // if there's already an input type in this field, skip it
        if (node.arguments.find(function (arg) { return arg.name.value === _this.inputArgName; })) {
            return false;
        }
        // is there an argument with the correct name?
        return !!node.arguments.find(function (arg) { return _this.argNames.indexOf(arg.name.value) >= 0; });
    };
    FieldArgsToInputTypeRewriter.prototype.rewriteQuery = function (_a) {
        var _this = this;
        var node = _a.node, variableDefinitions = _a.variableDefinitions;
        var argsToNest = (node.arguments || []).filter(function (argument) { return _this.argNames.indexOf(argument.name.value) >= 0; });
        var newArguments = (node.arguments || []).filter(function (argument) { return _this.argNames.indexOf(argument.name.value) === -1; });
        var inputArgument = {
            kind: 'Argument',
            name: { kind: 'Name', value: this.inputArgName },
            value: {
                kind: 'ObjectValue',
                fields: argsToNest.map(function (arg) { return ({
                    kind: 'ObjectField',
                    name: arg.name,
                    value: arg.value
                }); })
            }
        };
        newArguments.push(inputArgument);
        return { variableDefinitions: variableDefinitions, node: __assign({}, node, { arguments: newArguments }) };
    };
    return FieldArgsToInputTypeRewriter;
}(Rewriter_1.default));
exports.default = FieldArgsToInputTypeRewriter;
//# sourceMappingURL=FieldArgsToInputTypeRewriter.js.map