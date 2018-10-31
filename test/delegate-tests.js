import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import { delegate } from '../libs/6502';

describe('delegate', () => {
    it('can be called even when empty', () => {
        const d = delegate();
        d(42, 'foo');
    });

    it('sequentially calls all functions with the parameters', () => {
        const results = [];
        const d = delegate(
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
        const d = delegate(
            () => {results.push(1);},
            () => {results.push(2);}
        );
        const third = () => {results.push(3);};
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
        const results = [];
        const d = delegate(
            () => {results.push(1);}
        );
        d.remove(() => {results.push('nope');});
        d();

        results.should.deep.equal([1]);
    });

    it('can filter out handlers', () => {
        const results = {};

        const d = delegate();
        d.filter = p => p;

        d.add(() => {results.one = true;}, true);
        d.add(() => {results.two = true;}, true);
        d.add(() => {results.three = true;}, false);
        d.add(() => {results.four = true;}, true);
        d.add(() => {results.five = true;}, false);

        d();

        results.should.deep.equal({one: true, two: true, four: true});
    });

    it('can filter out handlers based on delegate call parameters', () => {
        const results = {};

        const d = delegate();
        // The filter returns true if the delegate's parameter equals one of the first two calling arguments
        d.filter = (p, a, b) => (p === a || p === b);

        d.add(() => {results.one = true;}, 1);
        d.add(() => {results.two = true;}, 2);
        d.add(() => {results.three = true;}, 3);
        d.add(() => {results.four = true;}, 4);
        d.add(() => {results.five = true;}, 5);

        d(2, 4);

        results.should.deep.equal({two: true, four: true});
    });
});