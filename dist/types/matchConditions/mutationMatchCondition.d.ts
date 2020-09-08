import matchCondition from './matchCondition';
export interface MutationMatchConditionOpts {
    mutationNames?: string[];
    pathRegexes?: RegExp[];
}
declare const mutationMatchCondition: ({ mutationNames, pathRegexes }?: MutationMatchConditionOpts) => matchCondition;
export default mutationMatchCondition;
