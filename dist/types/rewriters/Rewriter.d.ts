import { ASTNode } from 'graphql';
import { NodeAndVarDefs } from '../ast';
import matchCondition from '../matchConditions/matchCondition';
export declare type Variables = {
    [key: string]: any;
} | undefined;
export declare type RootType = 'query' | 'mutation' | 'fragment';
export interface RewriterOpts {
    fieldName: string;
    rootTypes?: RootType[];
    matchConditions?: matchCondition[];
}
/**
 * Abstract base Rewriter class
 * Extend this class and overwrite its methods to create a new rewriter
 */
declare abstract class Rewriter {
    protected fieldName: string;
    protected rootTypes: RootType[];
    protected matchConditions?: matchCondition[];
    constructor({ fieldName, rootTypes, matchConditions }: RewriterOpts);
    matches(nodeAndVarDefs: NodeAndVarDefs, parents: ReadonlyArray<ASTNode>): boolean;
    rewriteQuery(nodeAndVarDefs: NodeAndVarDefs): NodeAndVarDefs;
    rewriteVariables(nodeAndVarDefs: NodeAndVarDefs, variables: Variables): Variables;
    rewriteResponse(response: any, key: string | number): any;
}
export default Rewriter;
