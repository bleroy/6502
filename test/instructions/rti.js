import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("RTI", () => {
    it("pulls the status register and PC back from the stack", () => {
        const cpu = new MCS6502();
        cpu.push(0x0F); // PC hi
        cpu.push(0x11); // PC lo
        cpu.push(0x29); // SR

        cpu.poke(0x200, 0x40); // RTI

        cpu.step();
        cpu.PC.should.equal(0xF12);
        cpu.SR.should.equal(0x29);
    });
});
