import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import { Address } from '../libs/6502';

describe('Address', () => {
    describe('constructor', () => {
        it('throws for values out of the 0 to 65535 range', () => {
            [-100, -1, 65536, 100000, 1.2, -1.2, Number.NaN].forEach(value => {
                expect(() => {new Address(value)}).to.throw(RangeError, value.toString(), `Address constructor failed to throw for value ${value}.`);
            });
        });

        it('builds a 0..65535 address', () => {
            [0, 1, 50, 127, 128, 255, 256, 32767, 32768, 65535].forEach(value => {
                const address = new Address(value);
                address.should.equal(value, `Value ${value} as an address should evaluate as that same number.`);
            });
        });
    });

    describe('toString', () => {
        it('formats as a 6502 notation address', () => {
            [
                // [value, formattedString]
                [    0, '$0000'],
                [    1, '$0001'],
                [   50, '$0032'],
                [  127, '$007F'],
                [  128, '$0080'],
                [  255, '$00FF'],
                [  256, '$0100'],
                [32767, '$7FFF'],
                [32768, '$8000'],
                [65535, '$FFFF']
            ].forEach(([value, formattedString]) => {
                const byte = new Address(value);
                byte.toString().should.equal(formattedString);
            });
        });
    });
});