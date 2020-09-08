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
var JsonToTypedObjectRewriter = /** @class */ (function (_super) {
    __extends(JsonToTypedObjectRewriter, _super);
    function JsonToTypedObjectRewriter(_a) {
        var fieldName = _a.fieldName, objectFields = _a.objectFields;
        var _this = _super.call(this, { fieldName: fieldName }) || this;
        _this.objectFields = objectFields;
        return _this;
    }
    JsonToTypedObjectRewriter.prototype.matches = function (nodeAndVars, parents) {
        if (!_super.prototype.matches.call(this, nodeAndVars, parents))
            return false;
        var node = nodeAndVars.node;
        // make sure there's no subselections on this field
        if (node.selectionSet)
            return false;
        return true;
    };
    JsonToTypedObjectRewriter.prototype.rewriteQuery = function (nodeAndVarDefs) {
        var node = nodeAndVarDefs.node;
        var variableDefinitions = nodeAndVarDefs.variableDefinitions;
        // if there's a subselection already, just return
        if (node.selectionSet)
            return nodeAndVarDefs;
        var selectionSet = this.generateSelectionSet(this.objectFields);
        return {
            variableDefinitions: variableDefinitions,
            node: __assign({}, node, { selectionSet: selectionSet })
        };
    };
    JsonToTypedObjectRewriter.prototype.generateSelectionSet = function (fields) {
        var _this = this;
        return {
            kind: 'SelectionSet',
            selections: fields.map(function (_a) {
                var name = _a.name, subfields = _a.subfields;
                return (__assign({ kind: 'Field', name: { kind: 'Name', value: name } }, (subfields && {
                    selectionSet: _this.generateSelectionSet(subfields)
                })));
            })
        };
    };
    return JsonToTypedObjectRewriter;
}(Rewriter_1.default));
exports.default = JsonToTypedObjectRewriter;
//# sourceMappingURL=JsonToTypedObjectRewriter.js.map