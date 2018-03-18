import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("INC", () => {
    it("increments a memory location and properly sets flags", () => {
        const cpu = new MCS6502();

        cpu.poke(0x1210, 0x00, 0x7F, 0xFF);

        cpu.poke(0x200,
            0xEE, 0x10, 0x12,  // INC $1210
            0xEE, 0x11, 0x12,  // INC $1211
            0xEE, 0x12, 0x12); // INC $1213

        cpu.step();
        cpu.peek(0x1210).should.equal(0x01);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;

        cpu.step();
        cpu.peek(0x1211).should.equal(0x80);
        cpu.Z.should.be.false;
        cpu.N.should.be.true;

        cpu.step();
        cpu.peek(0x1212).should.equal(0x00);
        cpu.Z.should.be.true;
        cpu.N.should.be.false;
    });
});
