"use strict";
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
var utils_1 = require("./utils");
var ignoreKeys = new Set(['loc']);
/** @hidden */
exports.nodesMatch = function (node1, node2) {
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
                if (!exports.nodesMatch(val1[i], val2[i]))
                    return false;
            }
        }
        else if (typeof val1 === 'object') {
            if (!exports.nodesMatch(val1, val2))
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
                utils_1.pushToArrayAtKey(partialPathMap, node.name.value, exports.extractPath(curParents));
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
                        utils_1.pushToArrayAtKey(mergedPaths, childFragmentName, mergedPath);
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
exports.FragmentTracer = FragmentTracer;
/**
 * Walk the document add rewrite nodes along the way
 * @param doc
 * @param callback Called on each node, and returns a new rewritten node
 * @hidden
 */
exports.rewriteDoc = function (doc, callback) {
    var variableDefinitions = exports.extractVariableDefinitions(doc);
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
    return exports.replaceVariableDefinitions(rewrittenDoc, variableDefinitions);
};
/** @hidden */
exports.extractVariableDefinitions = function (doc) {
    for (var _i = 0, _a = doc.definitions; _i < _a.length; _i++) {
        var def = _a[_i];
        if (def.kind === 'OperationDefinition') {
            return def.variableDefinitions || [];
        }
    }
    return [];
};
/** @hidden */
exports.replaceVariableDefinitions = function (doc, variableDefinitions) {
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
exports.extractPath = function (parents) {
    var path = [];
    parents.forEach(function (parent) {
        if (parent.kind === 'Field') {
            path.push(parent.name.value);
        }
    });
    return path;
};
/** @hidden */
exports.rewriteResultsAtPath = function (results, path, callback) {
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
            return exports.rewriteResultsAtPath(result, remainingPath, callback);
        });
    }
    else {
        newResults[curPathElm] = exports.rewriteResultsAtPath(curResults, remainingPath, callback);
    }
    return newResults;
};
//# sourceMappingURL=ast.js.map