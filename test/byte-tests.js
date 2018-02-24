import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
let should = chai.should();

import { Byte } from '../libs/6502';

describe('Byte', () => {
    describe('fromNumber', () => {
        it('throws for values out of the -128 to 255 range', () => {
            [-129, 256, -500, 500, 1.2, -1.2, Number.NaN].forEach(value => {
                expect(() => {Byte.fromNumber(value)}).to.throw(RangeError, value.toString(), `Byte.fromNumber failed to throw for value ${value}.`);
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
                let byte = Byte.fromNumber(signedValue);
                byte.should.equal(unsignedValue, `Value ${signedValue} should create value ${unsignedValue}, but was ${byte}.`);
            });
        });
    });

    describe('signedValue', () => {
        it('gives the right sign', () => {
            [-128, -127, -50, -1, 128, 255].forEach(b => {
                Math.sign(Byte.signedValue(b)).should.equal(-1, `Value ${b} should evaluate as a negative number.`);
            });

            Math.sign(Byte.signedValue(0)).should.equal(0, `Value 0 should evaluate as zero.`);

            [1, 50, 127].forEach(b => {
                Math.sign(Byte.signedValue(b)).should.equal(+1, `Value ${b} should evaluate as a positive number.`);
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
                Byte.toString(value).should.equal(formattedString);
            });
        });
    });
});