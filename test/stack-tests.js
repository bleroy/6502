import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
let should = chai.should();

import MCS6502, { Byte } from '../libs/6502';

describe('stack', () => {
    it('can push and pull', () => {
        let cpu = new MCS6502();

        cpu.push(0x13);
        cpu.pull().should.equal(0x13);

        cpu.push(0x12);
        cpu.pull().should.equal(0x12);

        for (let i = 0; i <= 0xFF; i++) {
            cpu.push(i);
        }

        for (let i = 0xFF; i >= 0; i--) {
            cpu.pull().valueOf().should.equal(new Byte(i).valueOf());
        }
    });
});
