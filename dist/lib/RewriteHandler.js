"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var ast_1 = require("./ast");
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
        var doc = graphql_1.parse(query);
        var fragmentTracer = new ast_1.FragmentTracer(doc);
        var rewrittenVariables = variables;
        var rewrittenDoc = ast_1.rewriteDoc(doc, function (nodeAndVars, parents) {
            var rewrittenNodeAndVars = nodeAndVars;
            _this.rewriters.forEach(function (rewriter) {
                var isMatch = rewriter.matches(nodeAndVars, parents);
                if (isMatch) {
                    rewrittenVariables = rewriter.rewriteVariables(rewrittenNodeAndVars, rewrittenVariables);
                    rewrittenNodeAndVars = rewriter.rewriteQuery(rewrittenNodeAndVars);
                    var simplePath = ast_1.extractPath(parents.concat([rewrittenNodeAndVars.node]));
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
        return { query: graphql_1.print(rewrittenDoc), variables: rewrittenVariables };
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
                rewrittenResponse = ast_1.rewriteResultsAtPath(rewrittenResponse, path, function (parentResponse, key) {
                    return rewriter.rewriteResponse(parentResponse, key);
                });
            });
        });
        return rewrittenResponse;
    };
    return RewriteHandler;
}());
exports.default = RewriteHandler;
//# sourceMappingURL=RewriteHandler.js.map