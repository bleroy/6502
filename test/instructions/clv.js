import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("CLV", () => {
    it("clears the overflow flag", () => {
        const cpu = new MCS6502({ V: true });

        cpu.poke(0x200, 0xB8); // CLD
        cpu.step();

        cpu.V.should.be.false;
    });
});
