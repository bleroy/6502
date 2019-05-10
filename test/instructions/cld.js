import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("CLD", () => {
    it("clears the decimal flag", () => {
        const cpu = new MCS6502({ D: true });

        cpu.poke(0x200, 0xD8); // CLD
        cpu.step();

        cpu.D.should.be.false;
    });
});
