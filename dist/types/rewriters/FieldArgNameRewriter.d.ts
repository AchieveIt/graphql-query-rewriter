import { ASTNode } from 'graphql';
import { NodeAndVarDefs } from '../ast';
import Rewriter, { RewriterOpts } from './Rewriter';
interface IFieldArgNameRewriterOpts extends RewriterOpts {
    oldArgName: string;
    newArgName: string;
}
/**
 * Rewriter which replaces the name of a single argument of a field
 * ex: change from thingID: ID! to thingId: ID!
 */
declare class FieldArgNameRewriter extends Rewriter {
    protected oldArgName: string;
    protected newArgName: string;
    constructor(options: IFieldArgNameRewriterOpts);
    matches(nodeAndVars: NodeAndVarDefs, parents: ASTNode[]): boolean;
    rewriteQuery({ node, variableDefinitions }: NodeAndVarDefs): NodeAndVarDefs;
}
export default FieldArgNameRewriter;
