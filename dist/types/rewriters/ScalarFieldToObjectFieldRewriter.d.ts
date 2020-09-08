import { ASTNode } from 'graphql';
import { NodeAndVarDefs } from '../ast';
import Rewriter, { RewriterOpts } from './Rewriter';
interface ScalarFieldToObjectFieldRewriterOpts extends RewriterOpts {
    objectFieldName: string;
}
/**
 * Rewriter which nests output fields inside of a new output object
 * ex: change from `field { subField }` to `field { subField { objectfield } }`
 */
declare class ScalarFieldToObjectFieldRewriter extends Rewriter {
    protected objectFieldName: string;
    constructor(options: ScalarFieldToObjectFieldRewriterOpts);
    matches(nodeAndVars: NodeAndVarDefs, parents: ASTNode[]): boolean;
    rewriteQuery(nodeAndVarDefs: NodeAndVarDefs): NodeAndVarDefs;
    rewriteResponse(response: any, key: string | number): any;
}
export default ScalarFieldToObjectFieldRewriter;
