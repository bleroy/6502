import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("ADC", () => {
    it("agrees 0 + 1 = 1", () => {
        const cpu = new MCS6502();

        cpu.poke(0x200, 0x69, 0x01); // ADC #$01
        cpu.step();
        cpu.A.should.equal(1);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.false;
    });

    it("finds 127 + 1 = -128 with overflow", () => {
        const cpu = new MCS6502({ A: 0x7F });

        cpu.poke(0x200, 0x69, 0x01); // ADC #$01
        cpu.step();
        cpu.A.should.equal(0x80);
        cpu.N.should.be.true;
        cpu.V.should.be.true;
        cpu.Z.should.be.false;
        cpu.C.should.be.false;
    });

    it("agrees -128 + 1 = -127", () => {
        const cpu = new MCS6502({ A: 0x80 });

        cpu.poke(0x200, 0x69, 0x01); // ADC #$01
        cpu.step();
        cpu.A.should.equal(0x81);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.true;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.false;
    });

    it("agrees -1 + 1 = 0", () => {
        const cpu = new MCS6502({ A: 0xFF });

        cpu.poke(0x200, 0x69, 0x01); // ADC #$01
        cpu.step();
        cpu.A.should.equal(0x00);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.true;
        cpu.C.should.be.true;
    });

    it("agrees 0 - 1 = -1", () => {
        const cpu = new MCS6502();

        cpu.poke(0x200, 0x69, 0xFF); // ADC #$FF
        cpu.step();
        cpu.A.should.equal(0xFF);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.true;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.false;
    });

    it("agrees 127 - 1 = 126", () => {
        const cpu = new MCS6502({ A: 0x7F });

        cpu.poke(0x200, 0x69, 0xFF); // ADC #$FF
        cpu.step();
        cpu.A.should.equal(0x7E);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.true;
    });

    it("finds -128 - 1 = 127 with overflow", () => {
        const cpu = new MCS6502({ A: 0x80 });

        cpu.poke(0x200, 0x69, 0xFF); // ADC #$FF
        cpu.step();
        cpu.A.should.equal(0x7F);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.true;
        cpu.Z.should.be.false;
        cpu.C.should.be.true;
    });

    it("agrees -1 - 1 = -2", () => {
        const cpu = new MCS6502({ A: 0xFF });

        cpu.poke(0x200, 0x69, 0xFF); // ADC #$FF
        cpu.step();
        cpu.A.should.equal(0xFE);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.true;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.true;
    });

    it("includes the carry", () => {
        const cpu = new MCS6502({ C: true });

        cpu.poke(0x200, 0x69, 0x01); // ADC #$01
        cpu.step();
        cpu.A.should.equal(0x02);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.false;
    });

    it("finds 1 + 1 = 2 also in decimal", () => {
        const cpu = new MCS6502({ A: 0x01, D: true });

        cpu.poke(0x200, 0x69, 0x01); // ADC #$01
        cpu.step();
        cpu.A.should.equal(0x02);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.false;
    });

    it("finds 49 + 1 = 50 in decimal", () => {
        const cpu = new MCS6502({ A: 0x49, D: true });

        cpu.poke(0x200, 0x69, 0x01); // ADC #$01
        cpu.step();
        cpu.A.should.equal(0x50);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.false;
    });

    it("finds 50 + 1 = 51 in decimal", () => {
        const cpu = new MCS6502({ A: 0x50, D: true });

        cpu.poke(0x200, 0x69, 0x01); // ADC #$01
        cpu.step();
        cpu.A.should.equal(0x51);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.false;
    });

    it("finds 99 + 1 = 0 with a carry in decimal", () => {
        const cpu = new MCS6502({ A: 0x99, D: true });

        cpu.poke(0x200, 0x69, 0x01); // ADC #$01
        cpu.step();
        cpu.A.should.equal(0x00);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.true;
        cpu.C.should.be.true;
    });

    it("finds 0 + 99 = 99 in decimal", () => {
        const cpu = new MCS6502({ D: true });

        cpu.poke(0x200, 0x69, 0x99); // ADC #$99
        cpu.step();
        cpu.A.should.equal(0x99);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.false;
    });

    it("finds 49 + 99 = 48 with carry in decimal", () => {
        const cpu = new MCS6502({ A: 0x49, D: true });

        cpu.poke(0x200, 0x69, 0x99); // ADC #$99
        cpu.step();
        cpu.A.should.equal(0x48);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.true;
    });

    it("finds 50 + 99 = 49 with carry in decimal", () => {
        const cpu = new MCS6502({ A: 0x50, D: true });

        cpu.poke(0x200, 0x69, 0x99); // ADC #$99
        cpu.step();
        cpu.A.should.equal(0x49);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.true;
    });
});
