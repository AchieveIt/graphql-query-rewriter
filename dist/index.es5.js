import { parse, print, parseType } from 'graphql';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

/** @hidden */
var identifyFunc = function (val) { return val; };
/** @hidden */
var pushToArrayAtKey = function (mapping, key, val) {
    if (!mapping[key])
        mapping[key] = [];
    mapping[key].push(val);
};

var ignoreKeys = new Set(['loc']);
/** @hidden */
var nodesMatch = function (node1, node2) {
    for (var _i = 0, _a = Object.keys(node1); _i < _a.length; _i++) {
        var key = _a[_i];
        if (ignoreKeys.has(key))
            continue;
        var val1 = node1[key];
        var val2 = node2[key];
        if (val1 && !val2)
            return false;
        if (Array.isArray(val1)) {
            if (val1.length !== val2.length)
                return false;
            for (var i = 0; i < val1.length; i++) {
                if (!nodesMatch(val1[i], val2[i]))
                    return false;
            }
        }
        else if (typeof val1 === 'object') {
            if (!nodesMatch(val1, val2))
                return false;
        }
        else if (val1 !== val2) {
            return false;
        }
    }
    return true;
};
/** @hidden */
var FragmentTracer = /** @class */ (function () {
    function FragmentTracer(doc) {
        this.doc = doc;
    }
    FragmentTracer.prototype.getPathsToFragment = function (fragmentName) {
        if (!this.fragmentPathMap) {
            this.fragmentPathMap = this.buildFragmentPathMap();
        }
        return this.fragmentPathMap[fragmentName] || [];
    };
    // prepend the paths from the original document into this fragment to the inner fragment paths
    FragmentTracer.prototype.prependFragmentPaths = function (fragmentName, pathWithinFragment) {
        return this.getPathsToFragment(fragmentName).map(function (path) { return path.concat(pathWithinFragment); });
    };
    FragmentTracer.prototype.getFragmentDefs = function () {
        return this.doc.definitions.filter(function (_a) {
            var kind = _a.kind;
            return kind === 'FragmentDefinition';
        });
    };
    FragmentTracer.prototype.getFragmentPartialPathMap = function (startNode) {
        var partialPathMap = {};
        var recursivelyBuildFragmentPaths = function (node, curParents) {
            if (node.kind === 'FragmentSpread') {
                pushToArrayAtKey(partialPathMap, node.name.value, extractPath(curParents));
            }
            var nextParents = curParents.concat([node]);
            if ('selectionSet' in node && node.selectionSet) {
                for (var _i = 0, _a = node.selectionSet.selections; _i < _a.length; _i++) {
                    var selection = _a[_i];
                    recursivelyBuildFragmentPaths(selection, nextParents);
                }
            }
        };
        recursivelyBuildFragmentPaths(startNode, []);
        return partialPathMap;
    };
    FragmentTracer.prototype.mergeFragmentPaths = function (fragmentName, paths, fragmentPartialPathsMap) {
        var mergedPaths = {};
        var resursivelyBuildMergedPathsMap = function (curFragmentName, curPaths, seenFragments) {
            // recursive fragments are invalid graphQL - just exit here. otherwise this will be an infinite loop
            if (seenFragments.has(curFragmentName))
                return;
            var nextSeenFragments = new Set(seenFragments);
            nextSeenFragments.add(curFragmentName);
            var nextPartialPaths = fragmentPartialPathsMap[curFragmentName];
            // if there are not other fragments nested inside of this fragment, we're done
            if (!nextPartialPaths)
                return;
            for (var _i = 0, _a = Object.entries(nextPartialPaths); _i < _a.length; _i++) {
                var _b = _a[_i], childFragmentName = _b[0], childFragmentPaths = _b[1];
                for (var _c = 0, curPaths_1 = curPaths; _c < curPaths_1.length; _c++) {
                    var path = curPaths_1[_c];
                    var mergedChildPaths = [];
                    for (var _d = 0, childFragmentPaths_1 = childFragmentPaths; _d < childFragmentPaths_1.length; _d++) {
                        var childPath = childFragmentPaths_1[_d];
                        var mergedPath = path.concat(childPath);
                        mergedChildPaths.push(mergedPath);
                        pushToArrayAtKey(mergedPaths, childFragmentName, mergedPath);
                    }
                    resursivelyBuildMergedPathsMap(childFragmentName, mergedChildPaths, nextSeenFragments);
                }
            }
        };
        resursivelyBuildMergedPathsMap(fragmentName, paths, new Set());
        return mergedPaths;
    };
    FragmentTracer.prototype.buildFragmentPathMap = function () {
        var mainOperation = this.doc.definitions.find(function (node) { return node.kind === 'OperationDefinition'; });
        if (!mainOperation)
            return {};
        // partial paths are the paths inside of each fragmnt to other fragments
        var fragmentPartialPathsMap = {};
        for (var _i = 0, _a = this.getFragmentDefs(); _i < _a.length; _i++) {
            var fragmentDef = _a[_i];
            fragmentPartialPathsMap[fragmentDef.name.value] = this.getFragmentPartialPathMap(fragmentDef);
        }
        // start with the direct paths to fragments inside of the main operation
        var simpleFragmentPathMap = this.getFragmentPartialPathMap(mainOperation);
        var fragmentPathMap = __assign({}, simpleFragmentPathMap);
        // next, we'll recursively trace the partials into their subpartials to fill out all possible paths to each fragment
        for (var _b = 0, _c = Object.entries(simpleFragmentPathMap); _b < _c.length; _b++) {
            var _d = _c[_b], fragmentName = _d[0], simplePaths = _d[1];
            var mergedFragmentPathsMap = this.mergeFragmentPaths(fragmentName, simplePaths, fragmentPartialPathsMap);
            for (var _e = 0, _f = Object.entries(mergedFragmentPathsMap); _e < _f.length; _e++) {
                var _g = _f[_e], mergedFragmentName = _g[0], mergedFragmentPaths = _g[1];
                fragmentPathMap[mergedFragmentName] = (fragmentPathMap[mergedFragmentName] || []).concat(mergedFragmentPaths);
            }
        }
        return fragmentPathMap;
    };
    return FragmentTracer;
}());
/**
 * Walk the document add rewrite nodes along the way
 * @param doc
 * @param callback Called on each node, and returns a new rewritten node
 * @hidden
 */
var rewriteDoc = function (doc, callback) {
    var variableDefinitions = extractVariableDefinitions(doc);
    var walkRecursive = function (curNodeAndVars, curParents) {
        var nextNodeAndVars = callback(curNodeAndVars, curParents);
        variableDefinitions = nextNodeAndVars.variableDefinitions;
        var node = nextNodeAndVars.node;
        var nextParents = curParents.concat([node]);
        for (var _i = 0, _a = Object.keys(node); _i < _a.length; _i++) {
            var key = _a[_i];
            if (key === 'loc')
                continue;
            var val = node[key];
            if (Array.isArray(val)) {
                node[key] = val.map(function (elm) {
                    if (typeof elm === 'object') {
                        var next = {
                            variableDefinitions: variableDefinitions,
                            node: elm
                        };
                        return walkRecursive(next, nextParents);
                    }
                    return elm;
                });
            }
            else if (typeof val === 'object') {
                var next = {
                    variableDefinitions: variableDefinitions,
                    node: val
                };
                node[key] = walkRecursive(next, nextParents);
            }
        }
        return node;
    };
    var root = {
        variableDefinitions: variableDefinitions,
        node: doc
    };
    var rewrittenDoc = walkRecursive(root, []);
    return replaceVariableDefinitions(rewrittenDoc, variableDefinitions);
};
/** @hidden */
var extractVariableDefinitions = function (doc) {
    for (var _i = 0, _a = doc.definitions; _i < _a.length; _i++) {
        var def = _a[_i];
        if (def.kind === 'OperationDefinition') {
            return def.variableDefinitions || [];
        }
    }
    return [];
};
/** @hidden */
var replaceVariableDefinitions = function (doc, variableDefinitions) {
    var definitions = doc.definitions.map(function (def) {
        if (def.kind === 'OperationDefinition') {
            return __assign({}, def, { variableDefinitions: variableDefinitions });
        }
        return def;
    });
    return __assign({}, doc, { definitions: definitions });
};
/**
 * return the path that will be returned in the response from from the chain of parents
 */
/** @hidden */
var extractPath = function (parents) {
    var path = [];
    parents.forEach(function (parent) {
        if (parent.kind === 'Field') {
            path.push(parent.name.value);
        }
    });
    return path;
};
/** @hidden */
var rewriteResultsAtPath = function (results, path, callback) {
    if (path.length === 0)
        return results;
    var curPathElm = path[0];
    var newResults = __assign({}, results);
    var curResults = results[curPathElm];
    if (path.length === 1) {
        if (Array.isArray(curResults)) {
            return curResults.map(function (_, index) {
                var newValue = callback(curResults, index);
                return newValue;
            });
        }
        return callback(results, curPathElm);
    }
    var remainingPath = path.slice(1);
    // if the path stops here, just return results without any rewriting
    if (curResults === undefined || curResults === null)
        return results;
    if (Array.isArray(curResults)) {
        newResults[curPathElm] = curResults.map(function (result) {
            return rewriteResultsAtPath(result, remainingPath, callback);
        });
    }
    else {
        newResults[curPathElm] = rewriteResultsAtPath(curResults, remainingPath, callback);
    }
    return newResults;
};

/**
 * Create a new instance of this class for each request that needs to be processed
 * This class handles rewriting the query and the reponse according to the rewriters passed in
 */
var RewriteHandler = /** @class */ (function () {
    function RewriteHandler(rewriters) {
        this.matches = [];
        this.hasProcessedRequest = false;
        this.hasProcessedResponse = false;
        this.rewriters = rewriters;
    }
    /**
     * Call this on a graphQL request in middleware before passing on to the real graphql processor
     * @param query The graphQL query
     * @param variables The variables map for the graphQL query
     */
    RewriteHandler.prototype.rewriteRequest = function (query, variables) {
        var _this = this;
        if (this.hasProcessedRequest)
            throw new Error('This handler has already rewritten a request');
        this.hasProcessedRequest = true;
        var doc = parse(query);
        var fragmentTracer = new FragmentTracer(doc);
        var rewrittenVariables = variables;
        var rewrittenDoc = rewriteDoc(doc, function (nodeAndVars, parents) {
            var rewrittenNodeAndVars = nodeAndVars;
            _this.rewriters.forEach(function (rewriter) {
                var isMatch = rewriter.matches(nodeAndVars, parents);
                if (isMatch) {
                    rewrittenVariables = rewriter.rewriteVariables(rewrittenNodeAndVars, rewrittenVariables);
                    rewrittenNodeAndVars = rewriter.rewriteQuery(rewrittenNodeAndVars);
                    var simplePath = extractPath(parents.concat([rewrittenNodeAndVars.node]));
                    var paths = [simplePath];
                    var fragmentDef = parents.find(function (_a) {
                        var kind = _a.kind;
                        return kind === 'FragmentDefinition';
                    });
                    if (fragmentDef) {
                        paths = fragmentTracer.prependFragmentPaths(fragmentDef.name.value, simplePath);
                    }
                    _this.matches.push({
                        rewriter: rewriter,
                        paths: paths
                    });
                }
                return isMatch;
            });
            return rewrittenNodeAndVars;
        });
        return { query: print(rewrittenDoc), variables: rewrittenVariables };
    };
    /**
     * Call this on the response returned from graphQL before passing it back to the client
     * This will change the output to match what the original query requires
     * @param response The graphQL response object
     */
    RewriteHandler.prototype.rewriteResponse = function (response) {
        if (this.hasProcessedResponse)
            throw new Error('This handler has already returned a response');
        this.hasProcessedResponse = true;
        var rewrittenResponse = response;
        this.matches.reverse().forEach(function (_a) {
            var rewriter = _a.rewriter, paths = _a.paths;
            paths.forEach(function (path) {
                rewrittenResponse = rewriteResultsAtPath(rewrittenResponse, path, function (parentResponse, key) {
                    return rewriter.rewriteResponse(parentResponse, key);
                });
            });
        });
        return rewrittenResponse;
    };
    return RewriteHandler;
}());

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
}(Rewriter));

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
}(Rewriter));

/**
 * Rewriter which replaces the type of a single argument of a field
 * ex: change from id: String! to id: ID!
 */
var FieldArgTypeRewriter = /** @class */ (function (_super) {
    __extends(FieldArgTypeRewriter, _super);
    function FieldArgTypeRewriter(options) {
        var _this = _super.call(this, options) || this;
        _this.argName = options.argName;
        _this.oldTypeNode = parseType(options.oldType);
        _this.newTypeNode = parseType(options.newType);
        _this.coerceVariable = options.coerceVariable || identifyFunc;
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
                return nodesMatch(this.oldTypeNode, varDefinition.type);
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
}(Rewriter));

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
}(Rewriter));

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
}(Rewriter));

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
}(Rewriter));

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
            var pathStr_1 = extractPath(parents.concat([node])).join('.');
            if (!pathRegexes.find(function (pathRegex) { return pathRegex.test(pathStr_1); })) {
                return false;
            }
        }
        return true;
    };
};

/** @hidden */
var operationMatchCondition = (function (_a) {
    var _b = _a === void 0 ? {} : _a, operationNames = _b.operationNames, operationTypes = _b.operationTypes, pathRegexes = _b.pathRegexes;
    return function (_a, parents) {
        var node = _a.node;
        var operationDef = parents.find(function (_a) {
            var kind = _a.kind;
            return kind === 'OperationDefinition';
        });
        if (!operationDef)
            return false;
        if (operationNames) {
            if (!operationDef.name || !operationNames.includes(operationDef.name.value)) {
                return false;
            }
        }
        if (operationTypes && !operationTypes.includes(operationDef.operation)) {
            return false;
        }
        if (pathRegexes) {
            var pathStr_1 = extractPath(parents.concat([node])).join('.');
            if (!pathRegexes.find(function (pathRegex) { return pathRegex.test(pathStr_1); })) {
                return false;
            }
        }
        return true;
    };
});

var queryMatchCondition = function (_a) {
    var _b = _a === void 0 ? {} : _a, queryNames = _b.queryNames, pathRegexes = _b.pathRegexes;
    return operationMatchCondition({
        pathRegexes: pathRegexes,
        operationNames: queryNames,
        operationTypes: ['query']
    });
};

var mutationMatchCondition = function (_a) {
    var _b = _a === void 0 ? {} : _a, mutationNames = _b.mutationNames, pathRegexes = _b.pathRegexes;
    return operationMatchCondition({
        pathRegexes: pathRegexes,
        operationNames: mutationNames,
        operationTypes: ['mutation']
    });
};

export { RewriteHandler, Rewriter, FieldArgNameRewriter, FieldArgsToInputTypeRewriter, FieldArgTypeRewriter, NestFieldOutputsRewriter, ScalarFieldToObjectFieldRewriter, JsonToTypedObjectRewriter, fragmentMatchCondition, queryMatchCondition, mutationMatchCondition };
//# sourceMappingURL=index.es5.js.map
