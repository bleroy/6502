import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("SBC", () => {
    it("finds 0 - 1 = -2 when carry is unset", () => {
        const cpu = new MCS6502();

        cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
        cpu.step();
        cpu.A.should.equal(0xFE);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.true;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.false;
    });

    it("finds 127 - 1 = 126 when carry is unset", () => {
        const cpu = new MCS6502({ A: 0x7F });

        cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
        cpu.step();
        cpu.A.should.equal(0x7D);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.true;
    });

    it("finds -128 - 1 = 126 with overflow when carry is unset", () => {
        const cpu = new MCS6502({ A: 0x80 });

        cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
        cpu.step();
        cpu.A.should.equal(0x7E);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.true;
        cpu.Z.should.be.false;
        cpu.C.should.be.true;
    });

    it("finds -1 - 1 = -3 when carry is unset", () => {
        const cpu = new MCS6502({ A: 0xFF });

        cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
        cpu.step();
        cpu.A.should.equal(0xFD);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.true;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.true;
    });

    it("finds 2 - 1 = 0 when carry is unset", () => {
        const cpu = new MCS6502({ A: 0x02 });

        cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
        cpu.step();
        cpu.A.should.equal(0x00);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.true;
        cpu.C.should.be.true;
    });

    it("finds 5 - 1 = 3 when carry is unset", () => {
        const cpu = new MCS6502({ A: 0x05 });

        cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
        cpu.step();
        cpu.A.should.equal(0x03);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.true;
    });

    it("agrees 5 - 1 = 4 when carry is set", () => {
        const cpu = new MCS6502({ A: 0x05, C: true });

        cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
        cpu.step();
        cpu.A.should.equal(0x04);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.true;
    });

    it("agrees 0 - 1 = -1 when carry is set", () => {
        const cpu = new MCS6502({ A: 0x00, C: true });

        cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
        cpu.step();
        cpu.A.should.equal(0xFF);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.true;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.false;
    });

    it("thinks 0 - 1 = 98 when carry is unset in decimal mode", () => {
        const cpu = new MCS6502({ A: 0x00, D: true });

        cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
        cpu.step();
        cpu.A.should.equal(0x98);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.false;
    });

    it("thinks 99 - 1 = 97 when carry is unset in decimal mode", () => {
        const cpu = new MCS6502({ A: 0x99, D: true });

        cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
        cpu.step();
        cpu.A.should.equal(0x97);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.true;
    });

    it("thinks 50 - 1 = 48 when carry is unset in decimal mode", () => {
        const cpu = new MCS6502({ A: 0x50, D: true });

        cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
        cpu.step();
        cpu.A.should.equal(0x48);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.true;
    });

    it("thinks 2 - 1 = 0 when carry is unset in decimal mode", () => {
        const cpu = new MCS6502({ A: 0x02, D: true });

        cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
        cpu.step();
        cpu.A.should.equal(0x00);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.true;
        cpu.C.should.be.true;
    });

    it("thinks 10 - 11 = 98 when carry is unset in decimal mode", () => {
        const cpu = new MCS6502({ A: 0x10, D: true });

        cpu.poke(0x200, 0xE9, 0x11); // SBC #$11
        cpu.step();
        cpu.A.should.equal(0x98);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.false;
    });

    it("thinks 5 - 1 = 4 when carry is set in decimal mode", () => {
        const cpu = new MCS6502({ A: 0x05, D: true, C: true });

        cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
        cpu.step();
        cpu.A.should.equal(0x04);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.true;
    });

    it("thinks 0 - 1 = 99 when carry is set in decimal mode", () => {
        const cpu = new MCS6502({ A: 0x00, D: true, C: true });

        cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
        cpu.step();
        cpu.A.should.equal(0x99);
        cpu.PC.should.equal(0x202);
        cpu.N.should.be.false;
        cpu.V.should.be.false;
        cpu.Z.should.be.false;
        cpu.C.should.be.false;
    });
});
