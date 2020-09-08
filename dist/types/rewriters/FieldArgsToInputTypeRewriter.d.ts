import { ASTNode } from 'graphql';
import { NodeAndVarDefs } from '../ast';
import Rewriter, { RewriterOpts } from './Rewriter';
interface FieldArgsToInputTypeRewriterOpts extends RewriterOpts {
    argNames: string[];
    inputArgName?: string;
}
/**
 * Rewriter which replaces the args to a field with an input type
 * ex: change from field(id: $id, arg2: $arg2) to field(input: { id: $id, arg2: $arg2 })
 */
declare class FieldArgsToInputTypeRewriter extends Rewriter {
    protected argNames: string[];
    protected inputArgName: string;
    constructor(options: FieldArgsToInputTypeRewriterOpts);
    matches(nodeAndVars: NodeAndVarDefs, parents: ASTNode[]): boolean;
    rewriteQuery({ node, variableDefinitions }: NodeAndVarDefs): NodeAndVarDefs;
}
export default FieldArgsToInputTypeRewriter;
