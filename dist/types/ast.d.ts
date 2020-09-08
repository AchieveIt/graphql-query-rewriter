import { ASTNode, DocumentNode, VariableDefinitionNode } from 'graphql';
/** @hidden */
export declare const nodesMatch: (node1: ASTNode, node2: ASTNode) => boolean;
/** @hidden */
export interface NodeAndVarDefs {
    node: ASTNode;
    variableDefinitions: ReadonlyArray<VariableDefinitionNode>;
}
/** @hidden */
export interface FragmentPathMap {
    [fragmentName: string]: ReadonlyArray<ReadonlyArray<string>>;
}
/** @hidden */
export declare class FragmentTracer {
    private fragmentPathMap?;
    private doc;
    constructor(doc: DocumentNode);
    getPathsToFragment(fragmentName: string): ReadonlyArray<ReadonlyArray<string>>;
    prependFragmentPaths(fragmentName: string, pathWithinFragment: ReadonlyArray<string>): ReadonlyArray<ReadonlyArray<string>>;
    private getFragmentDefs;
    private getFragmentPartialPathMap;
    private mergeFragmentPaths;
    private buildFragmentPathMap;
}
/**
 * Walk the document add rewrite nodes along the way
 * @param doc
 * @param callback Called on each node, and returns a new rewritten node
 * @hidden
 */
export declare const rewriteDoc: (doc: DocumentNode, callback: (nodeAndVars: NodeAndVarDefs, parents: ReadonlyArray<ASTNode>) => NodeAndVarDefs) => DocumentNode;
/** @hidden */
export declare const extractVariableDefinitions: (doc: DocumentNode) => ReadonlyArray<VariableDefinitionNode>;
/** @hidden */
export declare const replaceVariableDefinitions: (doc: DocumentNode, variableDefinitions: ReadonlyArray<VariableDefinitionNode>) => DocumentNode;
/**
 * return the path that will be returned in the response from from the chain of parents
 */
/** @hidden */
export declare const extractPath: (parents: ReadonlyArray<ASTNode>) => ReadonlyArray<string>;
/** @hidden */
interface ResultObj {
    [key: string]: any;
}
/** @hidden */
export declare const rewriteResultsAtPath: (results: ResultObj, path: ReadonlyArray<string>, callback: (parentResult: any, key: string | number) => any) => ResultObj;
export {};
