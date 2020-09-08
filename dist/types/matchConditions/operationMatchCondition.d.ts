import matchCondition from './matchCondition';
/** @hidden */
export interface OperationMatchConditionOpts {
    operationNames?: string[];
    operationTypes?: string[];
    pathRegexes?: RegExp[];
}
declare const _default: ({ operationNames, operationTypes, pathRegexes }?: OperationMatchConditionOpts) => matchCondition;
/** @hidden */
export default _default;
