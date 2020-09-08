import { ASTNode } from 'graphql';
import { NodeAndVarDefs } from '../ast';
import Rewriter, { RewriterOpts } from './Rewriter';
interface ObjectField {
    name: string;
    subfields?: ObjectField[];
}
interface JsonToTypedObjectRewriterOpts extends RewriterOpts {
    objectFields: ObjectField[];
}
export default class JsonToTypedObjectRewriter extends Rewriter {
    protected objectFields: ObjectField[];
    constructor({ fieldName, objectFields }: JsonToTypedObjectRewriterOpts);
    matches(nodeAndVars: NodeAndVarDefs, parents: ASTNode[]): boolean;
    rewriteQuery(nodeAndVarDefs: NodeAndVarDefs): NodeAndVarDefs;
    private generateSelectionSet;
}
export {};
