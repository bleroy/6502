import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("NOP", () => {
    it("does nothing", () => {
        const cpu = new MCS6502();

        cpu.poke(0x200, 0xEA); // NOP

        cpu.step();
        cpu.PC.should.equal(0x201);
        cpu.A.should.equal(0);
        cpu.X.should.equal(0);
        cpu.Y.should.equal(0);
        cpu.SR.should.equal(0x20);
        cpu.SP.should.equal(0xFF);
    });
});
