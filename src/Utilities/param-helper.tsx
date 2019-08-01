import { cloneDeep } from 'lodash';

export class ParamHelper {
    // Helper class for managing param object.
    // Param object is just a dictionary of lists where the keys map to
    // parameter names that contain a value or list of values

    // Convert URLSearchParams object to param object
    static parseParamString(paramString: string, numericTypes?: string[]) {
        let params = {};
        const paramObj = new URLSearchParams(paramString);
        let v;

        paramObj.forEach((val, key) => {
            // Parse value as number if it's included in the list of numeric
            // types.
            // It seems like there should be a better way to do this based off
            // of the interface for the parameters, but I can't figure out if
            // that's possible or not
            if (numericTypes.includes(key)) {
                v = Number(val);
            } else {
                v = val;
            }

            params = ParamHelper.appendParam(params, key, v);
        });

        return params;
    }

    // Replaces specified parameter with speficied value
    static setParam(
        p: Object,
        key: string,
        value: number | string | string[] | number[],
    ) {
        const params = cloneDeep(p);
        params[key] = value;

        return params;
    }

    // Appends parameter to existing value
    static appendParam(p: Object, key: string, value: number | string) {
        const params = cloneDeep(p);
        if (params[key]) {
            if (Array.isArray(params[key])) {
                params[key].push(value);
            } else {
                params[key] = [params[key], value];
            }
        } else {
            params[key] = value;
        }

        return params;
    }

    // Returns a reduced set of parameters. Useful when not all params should
    // be passed to the API
    static getReduced(p: Object, keys: string[]) {
        const params = cloneDeep(p);
        for (let k of keys) {
            delete params[k];
        }

        return params;
    }

    // Removes a parameter, or a specific key value pair from a parameter object
    static deleteParam(p: any, key: string, value?: string | number) {
        const params = cloneDeep(p);
        if (value && Array.isArray(params[key]) && params[key].length > 1) {
            const i = params[key].indexOf(value);
            if (i !== -1) {
                params[key].splice(i, 1);
            }
        } else {
            delete params[key];
        }

        return params;
    }

    // Checks to see if a specific key value pair exists
    static paramExists(params: Object, key: string, value: string | number) {
        if (params[key]) {
            const i = params[key].indexOf(value);
            return i !== -1;
        } else {
            return false;
        }
    }

    // Returns the query string for the set of parameters
    static getQueryString(params: Object) {
        let paramString = '';
        for (const key of Object.keys(params)) {
            if (Array.isArray(params[key])) {
                for (const val of params[key]) {
                    paramString += key + '=' + encodeURIComponent(val) + '&';
                }
            } else {
                paramString += key + '=' + params[key] + '&';
            }
        }

        // Remove trailing '&'
        paramString = paramString.substring(0, paramString.length - 1);
        return paramString;
    }
}
