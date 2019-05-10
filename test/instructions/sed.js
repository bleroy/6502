import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("SED", () => {
    it("sets the decimal flag", () => {
        const cpu = new MCS6502({ D: false });

        cpu.poke(0x200, 0xF8); // SED
        cpu.step();

        cpu.D.should.be.true;
    });
});
