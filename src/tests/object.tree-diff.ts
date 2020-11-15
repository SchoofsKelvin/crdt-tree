import * as JSON from '../object/json';
import { Tree } from "../object/tree";
import { applyOperations, calculateOperations } from "../object/tree-diff";
import { formatOperation, Operation } from "../operations";

console.log('===== TEST "object.tree-diff" =====');

const DATA_A = {
    a: {
        idk: 123,
        test: [1, 2, 3],
        static: { v: false },
    },
    a2: {
        a3: {
            a4: {
                a5: 'test',
            }
        },
        a3b: 'hi',
        a3c: { v: true },
    }
};

const DATA_B = {
    b: { b2: { b3: 123 } },
    a: {
        idk: 456,
        test: [1, 3, 5],
        static: { v: false },
    },
    a2: {
        a3: {
            a4: {
                a5: 'testing',
            }
        },
        b3b: 'hi',
        b3c: { v: true },
    }
};

const TREE_A = new Tree(DATA_A);
const TREE_B = new Tree(DATA_B);

if (TREE_A.getNode('a')!.getNode('idk')!.value !== 123) {
    console.error('TREE_A["a"]["idk"] does not equal 123 after new Tree!');
    process.exit(1);
}

const EXPECTED_CHANGES: Operation[] = [
    { type: 'set', path: ['a', 'idk'], value: 456 },
    { type: 'set', path: ['a', 'test', '1'], value: 3 },
    { type: 'set', path: ['a', 'test', '2'], value: 5 },
    {
        type: 'set',
        path: ['a2', 'a3', 'a4', 'a5'],
        value: 'testing'
    },
    { type: 'remove', path: ['a2', 'a3b'] },
    { type: 'remove', path: ['a2', 'a3c'] },
    { type: 'set', path: ['a2', 'b3b'], value: 'hi' },
    { type: 'set', path: ['a2', 'b3c'], value: { v: true } },
    { type: 'set', path: ['b'], value: { b2: { b3: 123 } } }
];

const changes = calculateOperations(TREE_A, TREE_B);
console.log('Calculated changes from TREE_A to TREE_B:');
changes.map(formatOperation).forEach(o => console.log('  -', o));
if (changes.length !== EXPECTED_CHANGES.length) {
    console.error(`Expected ${EXPECTED_CHANGES.length} changes, got ${changes.length} instead`);
    process.exit(1);
}
for (let i = 0; i < changes.length; i++) {
    const change = JSON.stringify(changes[i]);
    const expected = JSON.stringify(EXPECTED_CHANGES[i]);
    if (change !== expected) {
        console.error(`Change #${i + 1} does not match expectations:`);
        console.error(`  Expected change: ${expected}`);
        console.error(`  Produced change: ${change}`);
        process.exit(1);
    }
}

console.log('Applying changes:');
const TREE_NEW = applyOperations(TREE_A, changes);
if (TREE_A.getNode('a')!.getNode('idk')!.value !== 123) {
    console.error('TREE_A["a"]["idk"] does not equal 123 after applyOperations!');
    process.exit(1);
}
const tree_new_json = JSON.stringify(TREE_NEW.value);
const tree_b_json = JSON.stringify(TREE_B.value);
if (tree_new_json !== tree_b_json) {
    console.error(`New tree does not match expectations:`);
    console.error(`  Expected tree: ${tree_b_json}`);
    console.error(`  Produced tree: ${tree_new_json}`);
    process.exit(1);
}

const leftover = calculateOperations(TREE_NEW, TREE_B);
if (leftover.length) {
    console.error(`Expected 0 operations between TREE_NEW and TREE_B, but got ${leftover.length} instead`);
    process.exit(1);
}

// From TREE_B to TREE_A
{
    console.log('Checking TREE_B to TREE_A');
    const changes = calculateOperations(TREE_B, TREE_A);
    console.log('Calculated changes from TREE_B to TREE_A:');
    changes.map(formatOperation).forEach(o => console.log('  -', o));
    const TREE_NEW = applyOperations(TREE_B, changes);
    const tree_new_json = JSON.stringify(TREE_NEW.value);
    const tree_a_json = JSON.stringify(TREE_A.value);
    if (tree_new_json !== tree_a_json) {
        console.error(`New tree does not match expectations:`);
        console.error(`  Expected tree: ${tree_a_json}`);
        console.error(`  Produced tree: ${tree_new_json}`);
        process.exit(1);
    }
    console.log('  Applying resulting changes to TREE_B produced TREE_A as expected');
}

// JS Object stuff
{
    function changesForObjects(a: object, b: object): Operation[] {
        return calculateOperations(new Tree(a), new Tree(b));
    }
    function applyOperationsToObject(obj: object, operations: Operation[]): object {
        return applyOperations(new Tree(obj), operations).value;
    }
    const changes = changesForObjects(DATA_A, DATA_B);
    changes.map(formatOperation).forEach(o => console.log('  -', o));
    const result = applyOperationsToObject(DATA_A, changes);
    console.log(JSON.stringify(result, null, 4));
}
