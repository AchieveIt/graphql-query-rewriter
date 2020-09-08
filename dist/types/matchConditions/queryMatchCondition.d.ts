import matchCondition from './matchCondition';
export interface QueryMatchConditionOpts {
    queryNames?: string[];
    pathRegexes?: RegExp[];
}
declare const queryMatchCondition: ({ queryNames, pathRegexes }?: QueryMatchConditionOpts) => matchCondition;
export default queryMatchCondition;
