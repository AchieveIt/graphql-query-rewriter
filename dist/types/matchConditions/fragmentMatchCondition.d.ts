import matchCondition from './matchCondition';
export interface FragmentMatchConditionOpts {
    fragmentNames?: string[];
    fragmentTypes?: string[];
    pathRegexes?: RegExp[];
}
declare const fragmentMatchCondition: ({ fragmentNames, fragmentTypes, pathRegexes }?: FragmentMatchConditionOpts) => matchCondition;
export default fragmentMatchCondition;
