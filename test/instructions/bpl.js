import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("BPL", () => {
    it("branches ahead when positive", () => {
        const cpu = new MCS6502({ N: true });

        cpu.poke(0x200,
            0x10, 0x05,  // BPL $05 ; * = $0202 + $05 ($207)
            0x10, 0x05); // BPL $05 ; * = $0204 + $05 ($209)

        cpu.step();
        // The processor should have moved ahead without branching
        cpu.PC.should.equal(0x202);

        cpu.N = false;
        cpu.step();
        // Carry was clear, should have branched
        cpu.PC.should.equal(0x209);
    });

    it("branches back when positive", () => {
        const cpu = new MCS6502({ N: true });

        cpu.poke(0x200,
            0x10, 0xFB,  // BPL $FB ; * = $0202 - $05 ($1FD)
            0x10, 0xFB); // BPL $05 ; * = $0204 - $05 ($1FF)

        cpu.step();
        // The processor should have moved ahead without branching
        cpu.PC.should.equal(0x202);

        cpu.N = false;
        cpu.step();
        // Carry was clear, should have branched
        cpu.PC.should.equal(0x1FF);
    });
});
