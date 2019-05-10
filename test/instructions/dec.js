import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("DEC", () => {
    it("decrements a memory location and properly sets flags", () => {
        const cpu = new MCS6502();

        cpu.poke(0x1210, 0x00, 0x01, 0x80, 0xFF);

        cpu.poke(0x200,
            0xCE, 0x10, 0x12,  // DEC $1210
            0xCE, 0x11, 0x12,  // DEC $1211
            0xCE, 0x12, 0x12,  // DEC $1212
            0xCE, 0x13, 0x12); // DEC $1213

        cpu.step();
        cpu.peek(0x1210).should.equal(0xFF);
        cpu.Z.should.be.false;
        cpu.N.should.be.true;

        cpu.step();
        cpu.peek(0x1211).should.equal(0x00);
        cpu.Z.should.be.true;
        cpu.N.should.be.false;

        cpu.step();
        cpu.peek(0x1212).should.equal(0x7F);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;

        cpu.step();
        cpu.peek(0x1213).should.equal(0xFE);
        cpu.Z.should.be.false;
        cpu.N.should.be.true;
    });
});
