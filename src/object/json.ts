
export function parse(str: string): any {
    return JSON.parse(str);
}

/**
 * Version where the keys of objects (except arrays) are sorted in the outputted string.
 * Loses support for the `replacer` and `space` parameters, these are now just ignored.
 */
export function stringify(value: any, ...rest: any): string {
    if (typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) {
        return `[${value.map(v => stringify(v, ...rest)).join(', ')}]`;
    }
    const keys = Object.keys(value).sort();
    const entries = keys.map(k => `${stringify(k, ...rest)}:${stringify(value[k], ...rest)}`);
    return `{${entries.join(',')}}`
}
