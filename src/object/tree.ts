
import { Key } from '../operations';

export function splitPath(path: Key[]): [Key[], Key] {
    const { length } = path;
    if (!length) throw new Error('Expected path with at least 1 entry');
    return [path.slice(0, length - 1), path[length - 1]];
}

export function traversePath(tree: Tree, path: Key[], wrongNode?: (path: Key[], leaf?: Tree) => Tree | undefined): Tree | undefined {
    let current: Tree | undefined = tree;
    for (let i = 0; i < path.length; i++) {
        const currentPath = path.slice(0, i + 1);
        if (current.isLeaf) {
            current = wrongNode?.(currentPath, current);
        }
        if (!(current instanceof Tree)) return undefined;
        current = current.getNode(path[i]) || wrongNode?.(currentPath);
        if (!current) return undefined;
    }
    return current;
}

function isParentOf(parent: Tree, node: Tree) {
    const { path: parentPath } = parent;
    const { path: nodePath } = node;
    if (nodePath.length !== parentPath.length + 1) return false;
    for (let i = 0; i < parentPath.length; i++) {
        if (nodePath[i] !== parentPath[i]) return false;
    }
    return true;
}

function expectParentOf(parent: Tree, node: Tree) {
    if (isParentOf(parent, node)) return;
    throw new Error(`Expected node '${parent.path}' to be parent of '${node.path}'`);
}

function deepClone(value: any): any {
    if (Array.isArray(value)) return value.map(deepClone);
    if (typeof value === 'object') {
        const result: any = {};
        for (const key in value) result[key] = deepClone(value[key]);
        return result;
    }
    return value;
}

export class Tree {
    public readonly isLeaf: boolean;
    constructor(public readonly value: any, public readonly path: Key[] = []) {
        this.isLeaf = typeof value !== 'object';
    }
    public set(key: Key, value: any): void {
        if (this.isLeaf) throw new Error('This node is not an object');
        this.value[key] = value;
    }
    public addNode(node: Tree) {
        expectParentOf(this, node);
        if (this.isLeaf) throw new Error('This node is not an object');
        this.value[node.path[this.path.length]] = node.value;
    }
    public getNode(key: Key): Tree | undefined {
        if (key in this.value) {
            return new Tree(this.value[key], [...this.path, key]);
        }
        return undefined;
    }
    public removeNode(nodeOrKey: Tree | Key) {
        if (nodeOrKey instanceof Tree) {
            expectParentOf(this, nodeOrKey);
            delete this.value[nodeOrKey.path[nodeOrKey.path.length - 1]];
        } else {
            delete this.value[nodeOrKey];
        }
    }
    public clone(): Tree {
        return new Tree(deepClone(this.value), this.path);
    }
}
