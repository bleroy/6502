import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("LDX", () => {
    it("loads the X register", () => {
        const cpu = new MCS6502();

        cpu.poke(0x200,
            0xA2, 0x12, // LDX #$12
            0xA2, 0x00, // LDX #$00
            0xA2, 0x80, // LDX #$80
            0xA2, 0x7F  // LDX #$7F
        );

        cpu.step();
        cpu.X.should.equal(0x012);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;

        cpu.step();
        cpu.X.should.equal(0x00);
        cpu.Z.should.be.true;
        cpu.N.should.be.false;

        cpu.step();
        cpu.X.should.equal(0x80);
        cpu.Z.should.be.false;
        cpu.N.should.be.true;

        cpu.step();
        cpu.X.should.equal(0x7F);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
    });
});
