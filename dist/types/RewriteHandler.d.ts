import Rewriter, { Variables } from './rewriters/Rewriter';
interface RewriterMatch {
    rewriter: Rewriter;
    paths: ReadonlyArray<ReadonlyArray<string>>;
}
/**
 * Create a new instance of this class for each request that needs to be processed
 * This class handles rewriting the query and the reponse according to the rewriters passed in
 */
export default class RewriteHandler {
    matches: RewriterMatch[];
    private rewriters;
    private hasProcessedRequest;
    private hasProcessedResponse;
    constructor(rewriters: Rewriter[]);
    /**
     * Call this on a graphQL request in middleware before passing on to the real graphql processor
     * @param query The graphQL query
     * @param variables The variables map for the graphQL query
     */
    rewriteRequest(query: string, variables?: Variables): {
        query: string;
        variables: Variables;
    };
    /**
     * Call this on the response returned from graphQL before passing it back to the client
     * This will change the output to match what the original query requires
     * @param response The graphQL response object
     */
    rewriteResponse(response: any): any;
}
export {};
