import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502, {} from '../libs/6502';

const NO_BIT = 0x20, C_BIT = 0x01, Z_BIT = 0x02, I_BIT = 0x04,
    D_BIT = 0x08, B_BIT = 0x10, V_BIT = 0x40, N_BIT = 0x80;

describe('status register', () => {
    it('can write flags', () => {
        const cpu = new MCS6502();

        // By default, no flags are set, but bit 5 is always set.
        cpu.SR.should.equal(0x20);

        cpu.C = true;
        cpu.SR.should.equal(0x21);

        cpu.Z = true;
        cpu.SR.should.equal(0x23);

        cpu.I = true;
        cpu.SR.should.equal(0x27);

        cpu.D = true;
        cpu.SR.should.equal(0x2F);

        cpu.B = true;
        cpu.SR.should.equal(0x3F);

        cpu.V = true;
        cpu.SR.should.equal(0x7F);

        cpu.N = true;
        cpu.SR.should.equal(0xFF);

        cpu.C = false;
        cpu.SR.should.equal(0xFE);

        cpu.Z = false;
        cpu.SR.should.equal(0xFC);

        cpu.I = false;
        cpu.SR.should.equal(0xF8);

        cpu.D = false;
        cpu.SR.should.equal(0xF0);

        cpu.B = false;
        cpu.SR.should.equal(0xE0);

        cpu.V = false;
        cpu.SR.should.equal(0xA0);

        cpu.N = false;
        cpu.SR.should.equal(0x20);
    });

    it('can read flags', () => {
        const cpu = new MCS6502();

        cpu.C.should.be.false;
        cpu.Z.should.be.false;
        cpu.I.should.be.false;
        cpu.D.should.be.false;
        cpu.B.should.be.false;
        cpu.V.should.be.false;
        cpu.N.should.be.false;

        cpu.SR = NO_BIT | C_BIT;
        cpu.C.should.be.true;
        cpu.Z.should.be.false;
        cpu.I.should.be.false;
        cpu.D.should.be.false;
        cpu.B.should.be.false;
        cpu.V.should.be.false;
        cpu.N.should.be.false;

        cpu.SR = NO_BIT | C_BIT | N_BIT;
        cpu.C.should.be.true;
        cpu.Z.should.be.false;
        cpu.I.should.be.false;
        cpu.D.should.be.false;
        cpu.B.should.be.false;
        cpu.V.should.be.false;
        cpu.N.should.be.true;

        cpu.SR = NO_BIT | C_BIT | N_BIT | Z_BIT;
        cpu.C.should.be.true;
        cpu.Z.should.be.true;
        cpu.I.should.be.false;
        cpu.D.should.be.false;
        cpu.B.should.be.false;
        cpu.V.should.be.false;
        cpu.N.should.be.true;

        cpu.SR = NO_BIT | C_BIT | N_BIT | Z_BIT | V_BIT;
        cpu.C.should.be.true;
        cpu.Z.should.be.true;
        cpu.I.should.be.false;
        cpu.D.should.be.false;
        cpu.B.should.be.false;
        cpu.V.should.be.true;
        cpu.N.should.be.true;

        cpu.SR = NO_BIT | C_BIT | N_BIT | Z_BIT | V_BIT | B_BIT;
        cpu.C.should.be.true;
        cpu.Z.should.be.true;
        cpu.I.should.be.false;
        cpu.D.should.be.false;
        cpu.B.should.be.true;
        cpu.V.should.be.true;
        cpu.N.should.be.true;

        cpu.SR = NO_BIT | C_BIT | N_BIT | Z_BIT | V_BIT | B_BIT | D_BIT;
        cpu.C.should.be.true;
        cpu.Z.should.be.true;
        cpu.I.should.be.false;
        cpu.D.should.be.true;
        cpu.B.should.be.true;
        cpu.V.should.be.true;
        cpu.N.should.be.true;

        cpu.SR = NO_BIT | C_BIT | N_BIT | Z_BIT | V_BIT | B_BIT | D_BIT | I_BIT;
        cpu.C.should.be.true;
        cpu.Z.should.be.true;
        cpu.I.should.be.true;
        cpu.D.should.be.true;
        cpu.B.should.be.true;
        cpu.V.should.be.true;
        cpu.N.should.be.true;

        cpu.SR = NO_BIT;
        cpu.C.should.be.false;
        cpu.Z.should.be.false;
        cpu.I.should.be.false;
        cpu.D.should.be.false;
        cpu.B.should.be.false;
        cpu.V.should.be.false;
        cpu.N.should.be.false;

        cpu.SR = 0x00;
        cpu.C.should.be.false;
        cpu.Z.should.be.false;
        cpu.I.should.be.false;
        cpu.D.should.be.false;
        cpu.B.should.be.false;
        cpu.V.should.be.false;
        cpu.N.should.be.false;
        cpu.SR.should.equal(NO_BIT);
    });
});