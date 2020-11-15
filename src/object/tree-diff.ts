
import { Key, Operation } from "../operations";
import { splitPath, traversePath, Tree } from "./tree";
import * as JSON from './json';

function getSetValue(value: any, path: Key[]): Operation {
    return { type: 'set', path, value };
}

function calculateChanges(a: Tree, b: Tree, path: Key[]): Operation[] {
    if (!a.isLeaf && !b.isLeaf) return calculateOperations(a as Tree, b as Tree, path);
    if (a.isLeaf && b.isLeaf) {
        const { value: valueA } = a;
        const { value: valueB } = b;
        if (valueA === valueB) return [];
        // Not exactly perfect, but okay
        if (JSON.stringify(valueA) === JSON.stringify(valueB)) return [];
    }
    return [getSetValue(b.value, path)];
}

/** Gives a list of operations to apply to the first tree to get the second tree */
export function calculateOperations(a: Tree, b: Tree, path: Key[] = []): Operation[] {
    const operations: Operation[] = [];
    let added = Object.entries(b.value);
    for (const key in a.value) {
        const nodeA = a.getNode(key)!;
        const nodeB = b.getNode(key);
        if (nodeB) {
            operations.push(...calculateChanges(nodeA, nodeB, [...path, key]));
            added = added.filter(e => e[0] !== key);
        } else {
            operations.push({ type: 'remove', path: [...path, key] });
        }
    }
    for (const [keyB, valB] of added) {
        operations.push(getSetValue(valB, [...path, keyB]));
    }
    return operations;
}

const createParent = (path: Key[], tree?: Tree) => tree || new Tree({}, path);

export function applyOperation(tree: Tree, operation: Operation): void {
    const [prefix, key] = splitPath(operation.path);
    switch (operation.type) {
        case 'remove': {
            const parent = traversePath(tree, prefix);
            if (parent instanceof Tree) parent.removeNode(key);
            break;
        }
        case 'set': {
            const parent = traversePath(tree, prefix, createParent);
            if (parent instanceof Tree) parent.set(key, operation.value);
            break;
        }
        default: throw new Error(`Unrecognized operation type '${operation!.type}'`);
    }
}

export function applyOperations(tree: Tree, operations: Operation[]): Tree {
    const result = tree.clone();
    for (const operation of operations) applyOperation(result, operation);
    return result;
}
