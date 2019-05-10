import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("JMP", () => {
    it("jumps to the address provided", () => {
        const cpu = new MCS6502();

        cpu.poke(0x200, 0x4C, 0x00, 0x34); // JMP $3400

        cpu.step();
        cpu.PC.should.equal(0x3400);
    });
});
