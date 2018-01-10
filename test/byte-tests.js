import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
let should = chai.should();

import { Byte } from '../libs/6502';

describe('Byte', () => {
    describe('constructor', () => {
        it('throws for values out of the -128 to 255 range', () => {
            [-129, 256, -500, 500, 1.2, -1.2, Number.NaN].forEach(value => {
                expect(() => {new Byte(value)}).to.throw(RangeError, value.toString(), `Byte constructor failed to throw for value ${value}.`);
            });
        });

        it('builds a 0..255 byte for values between -128 and 255', () => {
            [
                // [signedValue, unsignedValue]
                [-128, 0x80],
                [-127, 0x81],
                [ -50, 0xCE],
                [  -1, 0xFF],
                [   0, 0x00],
                [   1, 0x01],
                [  50, 0x32],
                [ 127, 0x7F],
                [ 128, 0x80],
                [ 255, 0xFF]
            ].forEach(([signedValue, unsignedValue]) => {
                let byte = new Byte(signedValue);
                if (signedValue < 128) {
                    byte.should.equal(signedValue, `Value ${signedValue} as a byte should evaluate as that same number.`);
                }
                else {
                    byte.should.equal(signedValue - 256, `Value ${signedValue} as a byte should evaluate as that same number minus 256.`);
                }
                byte.value.should.equal(unsignedValue, `Value ${signedValue} should create stored value ${unsignedValue}, but was ${byte}.`);
            });
        });
    });

    describe('sign', () => {
        it('gives the right sign', () => {
            [-128, -127, -50, -1, 128, 255].forEach(b => {
                Math.sign(new Byte(b)).should.equal(-1, `Value ${b} should evaluate as a negative number.`);
            });

            Math.sign(new Byte(0)).should.equal(0, `Value 0 should evaluate as zero.`);

            [1, 50, 127].forEach(b => {
                Math.sign(new Byte(b)).should.equal(+1, `Value ${b} should evaluate as a positive number.`);
            });
        });
    });

    describe('toString', () => {
        it('formats as a 6502 notation byte', () => {
            [
                // [value, formattedString]
                [-128, '$80'],
                [-127, '$81'],
                [ -50, '$CE'],
                [  -1, '$FF'],
                [   0, '$00'],
                [   1, '$01'],
                [  50, '$32'],
                [ 127, '$7F'],
                [ 128, '$80'],
                [ 255, '$FF']
            ].forEach(([value, formattedString]) => {
                let byte = new Byte(value);
                byte.toString().should.equal(formattedString);
            });
        });
    });
});