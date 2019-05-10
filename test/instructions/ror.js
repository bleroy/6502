import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("ROR", () => {
    it("rotates right and sets flags", () => {
        const cpu = new MCS6502();

        cpu.poke(0x200, 0x6A, 0x6A, 0x6A, 0x6A, 0x6A, 0x6A, 0x6A, 0x6A, 0x6A, 0x6A); // ROR A

        cpu.step();
        cpu.A.should.equal(0b00000000);
        cpu.Z.should.be.true;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.A = 0x10;
        cpu.step();
        cpu.A.should.equal(0b00001000);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.step();
        cpu.A.should.equal(0b00000100);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.step();
        cpu.A.should.equal(0b00000010);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.step();
        cpu.A.should.equal(0b00000001);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.step();
        cpu.A.should.equal(0b00000000);
        cpu.Z.should.be.true;
        cpu.N.should.be.false;
        cpu.C.should.be.true;

        cpu.step();
        cpu.A.should.equal(0b10000000);
        cpu.Z.should.be.false;
        cpu.N.should.be.true;
        cpu.C.should.be.false;

        cpu.step();
        cpu.A.should.equal(0b01000000);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.step();
        cpu.A.should.equal(0b00100000);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.step();
        cpu.A.should.equal(0b00010000);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;
    });
});