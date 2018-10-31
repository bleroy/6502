import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502, { Ram } from '../libs/6502';

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

    it('can trigger handlers when reading or writing memory', () => {
        let result = [];

        const cpu = new MCS6502();
        cpu.setMemoryReadHandler(0x400, (value) => {
            result.push(`reading ${value} from 400 but returning 42`);
            return 42;
        });
        cpu.setMemoryWriteHandler(0x400, (value) => {
            result.push(`writing ${value} to 400`);
        });

        cpu.poke(0x200, 84);
        cpu.memory.peek(0x200).should.equal(84);
        cpu.peek(0x200).should.equal(84);

        cpu.poke(0x400, 21);
        cpu.memory.peek(0x400).should.equal(0);

        result.push(`read ${cpu.peek(0x400)} from 400`);

        result.should.deep.equal(["writing 21 to 400", "reading 0 from 400 but returning 42", "read 42 from 400"]);

        result = [];
        cpu.setMemoryReadHandler(0x400);
        cpu.setMemoryWriteHandler(0x400);

        cpu.poke(0x400, 21);
        cpu.memory.peek(0x400).should.equal(21);
        cpu.peek(0x400).should.equal(21);
        result.should.deep.equal([]);
    });
});