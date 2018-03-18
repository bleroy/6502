import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("ROL", () => {
    it("rotates left and sets flags", () => {
        const cpu = new MCS6502();

        cpu.poke(0x200, 0x2A, 0x2A, 0x2A, 0x2A, 0x2A, 0x2A, 0x2A, 0x2A, 0x2A, 0x2A); // ROL A

        cpu.step();
        cpu.A.should.equal(0b00000000);
        cpu.Z.should.be.true;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.A = 0x01;
        cpu.step();
        cpu.A.should.equal(0b00000010);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.C = true;
        cpu.step();
        cpu.A.should.equal(0b00000101);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.step();
        cpu.A.should.equal(0b00001010);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.step();
        cpu.A.should.equal(0b00010100);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.step();
        cpu.A.should.equal(0b00101000);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.step();
        cpu.A.should.equal(0b01010000);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.step();
        cpu.A.should.equal(0b10100000);
        cpu.Z.should.be.false;
        cpu.N.should.be.true;
        cpu.C.should.be.false;

        cpu.step();
        cpu.A.should.equal(0b01000000);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.true;

        cpu.step();
        cpu.A.should.equal(0b10000001);
        cpu.Z.should.be.false;
        cpu.N.should.be.true;
        cpu.C.should.be.false;
    });
});