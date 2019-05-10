import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("TXS", () => {
    it("transfers the X register to the stack pointer but doesn't affect flags", () => {
        const cpu = new MCS6502({ X: 0x32, SP: 0x00 });

        cpu.poke(0x200,
            0x9A, 0x9A, 0x9A); // TXS

        cpu.step();
        cpu.X.should.equal(0x32);
        cpu.SP.should.equal(0x32);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;

        cpu.X = 0x00;
        cpu.step();
        cpu.SP.should.equal(0x00);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;

        cpu.X = 0x80;
        cpu.step();
        cpu.SP.should.equal(0x80);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
    });
});
