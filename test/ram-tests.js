import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import { Ram } from '../libs/6502';

describe('RAM', () => {
    it('can read and write bytes', () => {
        const memory = new Ram(3);
        memory.poke(0, 1);
        memory.poke(1, 2);
        memory.poke(2, 3);

        memory.peek(0).should.equal(1);
        memory.peek(1).should.equal(2);
        memory.peek(2).should.equal(3);
    });

    it('can read addresses', () => {
        const memory = new Ram([0x42, 0x34, 0x12, 0xFF]);

        memory.addressAt(1).should.equal(0x1234);
    });

    it('can constrain address read to zero page', () => {
        const memory = new Ram(512);
        memory.poke(0xFF, 0x34);
        memory.poke(0x00, 0x12);

        memory.addressAt(0xFF, true).should.equal(0x1234);
    });
});