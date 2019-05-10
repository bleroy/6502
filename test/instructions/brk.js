import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("BRK", () => {
    it("triggers an interruption", () => {
        const cpu = new MCS6502({ C: true, V: true });

        cpu.poke(0xFFFE, 0x34, 0x12); // -> $1234

        cpu.poke(0x204, 0x00); // BRK
        cpu.PC = 0x204;

        cpu.step();

        // We were at PC = 0x204. PC + 1 should be on the stack
        cpu.peek(0x1FF).should.equal(0x02);
        cpu.peek(0x1FE).should.equal(0x05);
        // Processor status, with B set, should be on the stack
        cpu.peek(0x1FD).should.equal(0x71);
        // The processor should be at $1234
        cpu.PC.should.equal(0x1234);
        cpu.SP.should.equal(0xFC);
        cpu.C.should.be.true;
        cpu.V.should.be.true;
        cpu.B.should.be.true;
        cpu.I.should.be.true;
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
    });

    it("ignores the IRQ disable flag", () => {
        const cpu = new MCS6502({ C: true, V: true, I: true });

        cpu.poke(0xFFFE, 0x34, 0x12); // -> $1234

        cpu.poke(0x204, 0x00); // BRK
        cpu.PC = 0x204;

        cpu.step();

        // We were at PC = 0x204. PC + 1 should be on the stack
        cpu.peek(0x1FF).should.equal(0x02);
        cpu.peek(0x1FE).should.equal(0x05);
        // Processor status, with B set, should be on the stack
        cpu.peek(0x1FD).should.equal(0x75);
        // The processor should be at $1234
        cpu.PC.should.equal(0x1234);
        cpu.SP.should.equal(0xFC);
        cpu.C.should.be.true;
        cpu.V.should.be.true;
        cpu.B.should.be.true;
        cpu.I.should.be.true;
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
    });
});
