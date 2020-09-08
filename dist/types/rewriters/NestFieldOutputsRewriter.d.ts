import { ASTNode } from 'graphql';
import { NodeAndVarDefs } from '../ast';
import Rewriter, { RewriterOpts } from './Rewriter';
interface NestFieldOutputsRewriterOpts extends RewriterOpts {
    newOutputName: string;
    outputsToNest: string[];
}
/**
 * Rewriter which nests output fields inside of a new output object
 * ex: change from `field { output1, output2 }` to `field { nestedOutputs { output1, output 2 } }`
 */
declare class NestFieldOutputsRewriter extends Rewriter {
    protected newOutputName: string;
    protected outputsToNest: string[];
    constructor(options: NestFieldOutputsRewriterOpts);
    matches(nodeAndVars: NodeAndVarDefs, parents: ASTNode[]): boolean;
    rewriteQuery(nodeAndVarDefs: NodeAndVarDefs): NodeAndVarDefs;
    rewriteResponse(response: any, key: string | number): any;
}
export default NestFieldOutputsRewriter;
