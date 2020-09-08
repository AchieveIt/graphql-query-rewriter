import { ASTNode, TypeNode } from 'graphql';
import { NodeAndVarDefs } from '../ast';
import Rewriter, { RewriterOpts, Variables } from './Rewriter';
interface FieldArgTypeRewriterOpts extends RewriterOpts {
    argName: string;
    oldType: string;
    newType: string;
    coerceVariable?: (variable: any) => any;
}
/**
 * Rewriter which replaces the type of a single argument of a field
 * ex: change from id: String! to id: ID!
 */
declare class FieldArgTypeRewriter extends Rewriter {
    protected argName: string;
    protected oldTypeNode: TypeNode;
    protected newTypeNode: TypeNode;
    protected coerceVariable: (variable: any) => any;
    constructor(options: FieldArgTypeRewriterOpts);
    matches(nodeAndVars: NodeAndVarDefs, parents: ASTNode[]): boolean;
    rewriteQuery({ node, variableDefinitions }: NodeAndVarDefs): {
        node: ASTNode;
        variableDefinitions: import("graphql").VariableDefinitionNode[];
    };
    rewriteVariables({ node }: NodeAndVarDefs, variables: Variables): {
        [x: string]: any;
    } | undefined;
    private extractMatchingVarRefName;
}
export default FieldArgTypeRewriter;
