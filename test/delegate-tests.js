import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
let should = chai.should();

import { delegate } from '../libs/6502';

describe('delegate', () => {
    it('can be called even when empty', () => {
        let d = delegate();
        d(42, 'foo');
    });

    it('sequentially calls all functions with the parameters', () => {
        let results = [];
        let d = delegate(
            a => {results.push(a);},
            () => {results.push(true);},
            (a, b) => {results.push(a + b);},
            (a, b) => {results.push(a - b);}
        );
        d(22, 20);

        results.should.deep.equal([22, true, 42, 2]);
    });

    it('can be added to and removed from', () => {
        let results = [];
        let d = delegate(
            () => {results.push(1);},
            () => {results.push(2);}
        );
        let third = () => {results.push(3);};
        d.add(third);
        d.add(() => {results.push(4)});
        d.add(third);
        d.remove(third);
        d();

        results.should.deep.equal([1, 2, 4, 3]);

        results = [];
        d.remove(third);
        d();
        results.should.deep.equal([1, 2, 4]);
    });

    it('does nothing if a function that\'s not there is removed', () => {
        let results = [];
        let d = delegate(
            () => {results.push(1);}
        );
        d.remove(() => {results.push('nope');});
        d();

        results.should.deep.equal([1]);
    });

    it('can filter out handlers', () => {
        let results = {};

        let d = delegate();
        d.filter = p => p;

        d.add(() => {results.one = true;}, true);
        d.add(() => {results.two = true;}, true);
        d.add(() => {results.three = true;}, false);
        d.add(() => {results.four = true;}, true);
        d.add(() => {results.five = true;}, false);

        d();

        results.should.deep.equal({one: true, two: true, four: true});
    });
});