
import { Key } from '../operations';

type SerializedTreeEntryTree = [type: 'tree', key: Key, entries: SerializedTreeEntry[]];
type SerializedTreeEntryLeaf = [type: 'leaf', key: Key, value: any];
export type SerializedTreeEntry = SerializedTreeEntryTree | SerializedTreeEntryLeaf;

export function nodeFromEntry(entry: SerializedTreeEntry, path: Key[]): Node {
    switch (entry[0]) {
        case 'leaf': return new Leaf([...path, entry[1]], entry[2]);
        case 'tree': return treeFromEntries(entry[2], [...path, entry[1]]);
        default: throw new Error(`Unrecognized entry type '${entry[0]}'`);
    }
}

export function treeFromEntries(entries: SerializedTreeEntry[], path: Key[] = []): Tree {
    const tree = new Tree(path);
    for (const e of entries) tree.addNode(nodeFromEntry(e, tree.path));
    return tree;
}

export function treeFromJsObject(obj: object, path: Key[] = []): Tree {
    const tree = new Tree(path);
    for (const key in obj) {
        const value = (obj as any)[key];
        if (typeof value === 'object') {
            tree.addNode(treeFromJsObject(value, [...path, key]));
        } else {
            tree.addNode(new Leaf([...path, key], value));
        }
    }
    return tree;
}

export function nodeToJsValue(node: Node): any {
    if (node.isLeaf) return (node as Leaf).value;
    const result: any = {};
    for (const [k, v] of (node as Tree).entries) {
        result[k] = nodeToJsValue(v);
    }
    return result;
}

export function splitPath(path: Key[]): [Key[], Key] {
    const { length } = path;
    if (!length) throw new Error('Expected path with at least 1 entry');
    return [path.slice(0, length - 1), path[length - 1]];
}

export function traversePath(tree: Tree, path: Key[], wrongNode?: (path: Key[], leaf?: Leaf) => Node | undefined): Node | undefined {
    let current: Node | undefined = tree;
    for (let i = 0; i < path.length; i++) {
        const currentPath = path.slice(0, i + 1);
        if (current.isLeaf) {
            current = wrongNode?.(currentPath, current as Leaf);
        }
        if (!(current instanceof Tree)) return undefined;
        current = current.getNode(path[i]) || wrongNode?.(currentPath);
        if (!current) return undefined;
    }
    return current;
}

export abstract class Node {
    constructor(public readonly isLeaf: boolean, public readonly path: Key[]) { }
    public abstract toSerializedEntry(): SerializedTreeEntry;
    public abstract clone(): Node;
}

function isParentOf(parent: Tree, node: Node) {
    const { path: parentPath } = parent;
    const { path: nodePath } = node;
    if (nodePath.length !== parentPath.length + 1) return false;
    for (let i = 0; i < parentPath.length; i++) {
        if (nodePath[i] !== parentPath[i]) return false;
    }
    return true;
}

function expectParentOf(parent: Tree, node: Node) {
    if (isParentOf(parent, node)) return;
    throw new Error(`Expected tree '${parent.path}' to be parent of '${node.path}'`);
}

export class Tree extends Node {
    public entries: Map<Key, Node>;
    constructor(path: Key[] = [], entries?: ReadonlyMap<Key, Node> | readonly (readonly [Key, Node])[]) {
        super(false, path);
        this.entries = new Map<Key, Node>([...(entries || [])]);
    }
    public addNode(node: Node) {
        expectParentOf(this, node);
        this.entries.set(node.path[this.path.length], node);
    }
    public getNode(key: Key): Node | undefined {
        return this.entries.get(key);
    }
    public removeNode(nodeOrKey: Node | Key) {
        if (nodeOrKey instanceof Node) {
            expectParentOf(this, nodeOrKey);
            this.entries.delete(nodeOrKey.path[nodeOrKey.path.length - 1]);
        } else {
            this.entries.delete(nodeOrKey);
        }
    }
    public toSerializedEntry(): SerializedTreeEntry {
        const entries: SerializedTreeEntry[] = [];
        for (const [key, node] of this.entries) entries.push(node.toSerializedEntry());
        entries.sort((a, b) => a[1] < b[1] ? -1 : 1);
        return ['tree', this.path[this.path.length - 1], entries];
    }
    public clone(): Tree {
        const result = new Tree(this.path);
        for (const e of this.entries) result.addNode(e[1].clone());
        return result;
    }
}

export class Leaf extends Node {
    constructor(path: Key[], public readonly value: any) {
        super(true, path);
    }
    public toSerializedEntry(): SerializedTreeEntry {
        return ['leaf', this.path[this.path.length - 1], this.value];
    }
    public clone(): Leaf {
        return this; // Immutable anyway
    }
}
