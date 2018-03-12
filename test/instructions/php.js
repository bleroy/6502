import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("PHP", () => {
    it("pushes the processor status onto the stack, with the break flag set", () => {
        const cpu = new MCS6502();
        cpu.SR = 0x27;

        cpu.poke(0x200, 0x08); // PHP

        cpu.step();
        cpu.SP.should.equal(0xFE);
        cpu.stackPeek().should.equal(0x37);
        cpu.SR.should.equal(0x27);
    });
});
