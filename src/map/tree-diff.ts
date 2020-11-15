
import { Key, Operation } from "../operations";
import { Leaf, Node, splitPath, traversePath, Tree, treeFromEntries } from "./tree";

function getSetNode(node: Node, path: Key[]): Operation {
    if (node.isLeaf) return { type: 'set-leaf', path, value: (node as Leaf).value };
    return { type: 'set-tree', path, entries: (node as Tree).toSerializedEntry()[2] };
}

function calculateChanges(a: Node, b: Node, path: Key[]): Operation[] {
    if (!a.isLeaf && !b.isLeaf) return calculateOperations(a as Tree, b as Tree, path);
    if (a.isLeaf && b.isLeaf) {
        const { value: valueA } = a as Leaf;
        const { value: valueB } = b as Leaf;
        if (valueA === valueB) return [];
        // Not exactly perfect, but okay
        if (JSON.stringify(valueA) === JSON.stringify(valueB)) return [];
    }
    return [getSetNode(b, path)];
}

/** Gives a list of operations to apply to the first tree to get the second tree */
export function calculateOperations(a: Tree, b: Tree, path: Key[] = []): Operation[] {
    const operations: Operation[] = [];
    let added = [...b.entries];
    for (const [keyA, nodeA] of a.entries) {
        const nodeB = b.getNode(keyA);
        if (nodeB) {
            operations.push(...calculateChanges(nodeA, nodeB, [...path, keyA]));
            added = added.filter(e => e[0] !== keyA);
        } else {
            operations.push({ type: 'remove', path: [...path, keyA] });
        }
    }
    for (const [keyB, nodeB] of added) {
        operations.push(getSetNode(nodeB, [...path, keyB]));
    }
    return operations;
}

const createParent = (path: Key[], leaf?: Node) => leaf || new Tree(path);

export function applyOperation(tree: Tree, operation: Operation): void {
    const [prefix, key] = splitPath(operation.path);
    switch (operation.type) {
        case 'remove': {
            const parent = traversePath(tree, prefix);
            if (parent instanceof Tree) parent.removeNode(key);
            break;
        }
        case 'set-leaf': {
            const parent = traversePath(tree, prefix, createParent);
            if (parent instanceof Tree) parent.addNode(new Leaf(operation.path, operation.value));
            break;
        }
        case 'set-tree': {
            const parent = traversePath(tree, prefix, createParent);
            if (parent instanceof Tree) parent.addNode(treeFromEntries(operation.entries, operation.path));
            break;
        }
        default: throw new Error(`Unrecognized operation type '${operation!.type}'`);
    }
}

export function applyOperations(tree: Tree, operations: Operation[]): void {
    for (const operation of operations) applyOperation(tree, operation);
}

export function withOperations(tree: Tree, operations: Operation[]): Tree {
    const result = tree.clone();
    applyOperations(tree, operations);
    return result;
}
