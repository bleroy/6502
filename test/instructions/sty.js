import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("STY", () => {
    it("stores Y into memory", () => {
        const cpu = new MCS6502();

        cpu.poke(0x200, 0x8C, 0x10, 0x12); // STY $1210

        cpu.step();
        cpu.peek(0x1210).should.equal(0x00);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;

        cpu.PC = 0x200;
        cpu.Y = 0x0F;
        cpu.step();
        cpu.peek(0x1210).should.equal(0x0F);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;

        cpu.PC = 0x200;
        cpu.Y = 0x80;
        cpu.step();
        cpu.peek(0x1210).should.equal(0x80);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
    });
});