"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** @hidden */
exports.identifyFunc = function (val) { return val; };
/** @hidden */
exports.pushToArrayAtKey = function (mapping, key, val) {
    if (!mapping[key])
        mapping[key] = [];
    mapping[key].push(val);
};
//# sourceMappingURL=utils.js.map