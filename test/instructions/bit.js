import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("BIT", () => {
    it("tests bits with the accumulator", () => {
        const cpu = new MCS6502();

        cpu.poke(0x1200, 0xC0);

        cpu.poke(0x200,
            0x2C, 0x00, 0x12, // BIT $1200
            0x2C, 0x00, 0x12,
            0x2C, 0x00, 0x12,
            0x2C, 0x00, 0x12,
            0x2C, 0x00, 0x12,
            0x2C, 0x00, 0x12
        );

        cpu.A = 0x01;
        cpu.step();
        cpu.Z.should.be.true;
        cpu.N.should.be.true;
        cpu.V.should.be.true;

        cpu.A = 0x0F;
        cpu.step();
        cpu.Z.should.be.true;
        cpu.N.should.be.true;
        cpu.V.should.be.true;

        cpu.A = 0x40;
        cpu.step();
        cpu.Z.should.be.false;
        cpu.N.should.be.true;
        cpu.V.should.be.true;

        cpu.A = 0x80;
        cpu.step();
        cpu.Z.should.be.false;
        cpu.N.should.be.true;
        cpu.V.should.be.true;

        cpu.A = 0xC0;
        cpu.step();
        cpu.Z.should.be.false;
        cpu.N.should.be.true;
        cpu.V.should.be.true;

        cpu.A = 0xFF;
        cpu.step();
        cpu.Z.should.be.false;
        cpu.N.should.be.true;
        cpu.V.should.be.true;
    });
});
