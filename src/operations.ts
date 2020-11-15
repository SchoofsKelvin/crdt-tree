import { SerializedTreeEntry } from "./map/tree";

export type Key = string | number;

export interface OperationBase {
    type: string;
}

export interface OperationSet {
    type: 'set';
    value: any;
    path: Key[];
}

export interface OperationSetLeaf {
    type: 'set-leaf';
    value: any;
    path: Key[];
}

export interface OperationSetTree {
    type: 'set-tree';
    entries: SerializedTreeEntry[];
    path: Key[];
}

export interface OperationRemove {
    type: 'remove';
    path: Key[];
}

const formatPath = (keys: Key[]) => keys.map(k => `[${JSON.stringify(k)}]`).join('');
export function formatOperation(operation: Operation): string {
    switch (operation.type) {
        case 'remove': return `remove(${formatPath(operation.path)})`;
        case 'set': return `set(${formatPath(operation.path)}, ${JSON.stringify(operation.value)})`;
        case 'set-leaf': return `set-leaf(${formatPath(operation.path)}, ${JSON.stringify(operation.value)})`;
        case 'set-tree': return `set-tree(${formatPath(operation.path)}, ${JSON.stringify(operation.entries)})`;
        default: throw new Error(`Unrecognized operation type '${operation!.type}'`);
    }
}

export type Operation = OperationSet | OperationSetLeaf | OperationSetTree | OperationRemove;
