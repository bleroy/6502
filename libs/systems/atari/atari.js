import MCS6502, { Address } from '../../6502';

// TODO: symbols & some immutability

/**
 * An Atari 8-bit emulator that emulates standard OS calls in JavaScript, without requiring ROMs.
 * The emulator is very far from simulating a complete Atari computer.
 * I'm implementing features as I need them in order to be able to run specific software in a web page.
 */
export default class Atari {
    /**
     * Constructs a new Atari 8 bit system
     * @param {Screen} screen - A screen to use as a display 
     */
    constructor(screen, palette) {
        this.cpu = new MCS6502();
        this.screen = screen;

        this.colors = new Array(256);
        for (let c = 0; c < 256; c++) { this.colors[c] = new Color(c, palette) }

        this.antic = new Antic(screen, this.cpu);
    }
}

/**
 * An abstract virtual screen for the Atari system.
 */
export class Screen {
    renderPixel(color) { }
    renderByte(byte, foreground, background) { }
    horizontalSync() { }
    verticalSync() { }
}

/**
 * An implementation of Screen that uses an HTML canvas for rendering.
 */
export class CanvasScreen extends Screen {
    /**
     * Creates a screen using the provided canvas.
     * @param {HTMLCanvasElement} canvas - a canvas element for the screen to use as its surface.
     * The resolution of the canvas should be at least 320x192, although larger canvases can theoretically
     * display larger screens, up to 384x240.
     * 
     * A screen constructs an image scan line by scan line, then pixel by pixel,because the Atari had the ability
     * to change arbitrary parameters, such as colors, at any time.
     */
    constructor(canvas, zoom = 1, smoothing = false) {
        super();

        this.zoom = zoom;

        this.canvas = canvas;
        this._context = canvas.getContext('2d');

        const doc = canvas.ownerDocument;

        const scanLine = this._scanLine = doc.createElement("canvas");
        scanLine.width = 384;
        scanLine.height = 1;
        this._scanLineContext = scanLine.getContext('2d');
        this._lineImageData = this._scanLineContext.createImageData(384, 1);

        this._context.imageSmoothingEnabled = this._scanLineContext.imageSmoothingEnabled = smoothing;
        this.verticalPosition = 0;
        this.horizontalPosition = 0;
        this._lineImageIndex = 0;
    }

    renderPixel(color) {
        const imgdata = this._lineImageData.data;
        imgdata[this._lineImageIndex++] = color.r;
        imgdata[this._lineImageIndex++] = color.g;
        imgdata[this._lineImageIndex++] = color.b;
        imgdata[this._lineImageIndex++] = 255;
    }

    renderByte(byte, foreground, background) {
        for (let c = 0; c < 8; c++) {
            const lit = (byte & (0x80 >>> c)) != 0;
            this.renderPixel(lit ? foreground : background);
        }
    }

    horizontalSync() {
        this._scanLineContext.putImageData(this._lineImageData, 0, 0);
        this._context.drawImage(this._scanLine,
            0, 0, 384, 1,
            0, this.verticalPosition * this.zoom, 384 * this.zoom, this.zoom);
        this._lineImageIndex = this.horizontalPosition = 0;
        this.verticalPosition++;
    }

    verticalSync() {
        this.verticalPosition = 0;
    }
}

/**
 * An Atari 256 color palette extracted from http://www.spacemonsters.co.uk/2011/10/the-atari-colour-palette/.
 * Note that color palette choice is a matter of perception, monitor settings, PAL vs. NTSC, and many other factors.
 * As such, this is an arbitrary choice, one that I've done my best to be easily replaceable.
 */
export const palette = [
    { r: 0, g: 0, b: 0 }, { r: 37, g: 37, b: 37 }, { r: 52, g: 52, b: 52 }, { r: 78, g: 78, b: 78 },
    { r: 104, g: 104, b: 104 }, { r: 117, g: 117, b: 117 }, { r: 142, g: 142, b: 142 }, { r: 164, g: 164, b: 164 },
    { r: 184, g: 184, b: 184 }, { r: 197, g: 197, b: 197 }, { r: 208, g: 208, b: 208 }, { r: 215, g: 215, b: 215 },
    { r: 225, g: 225, b: 225 }, { r: 234, g: 234, b: 234 }, { r: 244, g: 244, b: 244 }, { r: 255, g: 255, b: 255 },
    { r: 65, g: 32, b: 0 }, { r: 84, g: 40, b: 0 }, { r: 118, g: 55, b: 0 }, { r: 154, g: 80, b: 0 },
    { r: 195, g: 104, b: 6 }, { r: 228, g: 123, b: 7 }, { r: 255, g: 145, b: 26 }, { r: 255, g: 171, b: 29 },
    { r: 255, g: 197, b: 31 }, { r: 255, g: 208, b: 59 }, { r: 255, g: 216, b: 76 }, { r: 255, g: 230, b: 81 },
    { r: 255, g: 244, b: 86 }, { r: 255, g: 249, b: 112 }, { r: 255, g: 255, b: 144 }, { r: 255, g: 255, b: 170 },
    { r: 69, g: 25, b: 4 }, { r: 114, g: 30, b: 17 }, { r: 159, g: 36, b: 30 }, { r: 179, g: 58, b: 32 },
    { r: 200, g: 81, b: 32 }, { r: 227, g: 105, b: 32 }, { r: 252, g: 129, b: 32 }, { r: 253, g: 140, b: 37 },
    { r: 254, g: 152, b: 44 }, { r: 255, g: 174, b: 56 }, { r: 255, g: 185, b: 70 }, { r: 255, g: 191, b: 81 },
    { r: 255, g: 198, b: 109 }, { r: 255, g: 213, b: 135 }, { r: 255, g: 228, b: 152 }, { r: 255, g: 230, b: 171 },
    { r: 93, g: 31, b: 12 }, { r: 122, g: 36, b: 13 }, { r: 152, g: 44, b: 14 }, { r: 176, g: 47, b: 15 },
    { r: 191, g: 54, b: 36 }, { r: 211, g: 78, b: 42 }, { r: 231, g: 98, b: 62 }, { r: 243, g: 110, b: 74 },
    { r: 253, g: 120, b: 84 }, { r: 255, g: 138, b: 106 }, { r: 255, g: 152, b: 124 }, { r: 255, g: 164, b: 139 },
    { r: 255, g: 179, b: 158 }, { r: 255, g: 194, b: 178 }, { r: 255, g: 208, b: 195 }, { r: 255, g: 218, b: 208 },
    { r: 74, g: 23, b: 0 }, { r: 114, g: 31, b: 0 }, { r: 168, g: 19, b: 0 }, { r: 200, g: 33, b: 10 },
    { r: 223, g: 37, b: 18 }, { r: 236, g: 59, b: 36 }, { r: 250, g: 82, b: 54 }, { r: 252, g: 97, b: 72 },
    { r: 255, g: 112, b: 95 }, { r: 255, g: 126, b: 126 }, { r: 255, g: 143, b: 143 }, { r: 255, g: 157, b: 158 },
    { r: 255, g: 171, b: 173 }, { r: 255, g: 185, b: 189 }, { r: 255, g: 199, b: 206 }, { r: 255, g: 202, b: 222 },
    { r: 73, g: 0, b: 54 }, { r: 102, g: 0, b: 75 }, { r: 128, g: 3, b: 95 }, { r: 149, g: 15, b: 116 },
    { r: 170, g: 34, b: 136 }, { r: 186, g: 61, b: 153 }, { r: 202, g: 77, b: 169 }, { r: 215, g: 90, b: 182 },
    { r: 228, g: 103, b: 195 }, { r: 239, g: 114, b: 206 }, { r: 251, g: 126, b: 218 }, { r: 255, g: 141, b: 225 },
    { r: 255, g: 157, b: 229 }, { r: 255, g: 165, b: 231 }, { r: 255, g: 175, b: 234 }, { r: 255, g: 184, b: 236 },
    { r: 72, g: 3, b: 108 }, { r: 92, g: 4, b: 136 }, { r: 101, g: 13, b: 144 }, { r: 123, g: 35, b: 167 },
    { r: 147, g: 59, b: 191 }, { r: 157, g: 69, b: 201 }, { r: 167, g: 79, b: 211 }, { r: 178, g: 90, b: 222 },
    { r: 189, g: 101, b: 233 }, { r: 197, g: 109, b: 241 }, { r: 206, g: 118, b: 250 }, { r: 213, g: 131, b: 255 },
    { r: 218, g: 144, b: 255 }, { r: 222, g: 156, b: 255 }, { r: 226, g: 169, b: 255 }, { r: 230, g: 182, b: 255 },
    { r: 5, g: 30, b: 129 }, { r: 6, g: 38, b: 165 }, { r: 8, g: 47, b: 202 }, { r: 38, g: 61, b: 212 },
    { r: 68, g: 76, b: 222 }, { r: 79, g: 90, b: 236 }, { r: 90, g: 104, b: 255 }, { r: 101, g: 117, b: 255 },
    { r: 113, g: 131, b: 255 }, { r: 128, g: 145, b: 255 }, { r: 144, g: 160, b: 255 }, { r: 151, g: 169, b: 255 },
    { r: 159, g: 178, b: 255 }, { r: 175, g: 190, b: 255 }, { r: 192, g: 203, b: 255 }, { r: 205, g: 211, b: 255 },
    { r: 11, g: 7, b: 121 }, { r: 32, g: 28, b: 142 }, { r: 53, g: 49, b: 163 }, { r: 70, g: 66, b: 180 },
    { r: 87, g: 83, b: 197 }, { r: 97, g: 93, b: 207 }, { r: 109, g: 105, b: 219 }, { r: 123, g: 119, b: 233 },
    { r: 137, g: 133, b: 247 }, { r: 145, g: 141, b: 255 }, { r: 156, g: 152, b: 255 }, { r: 167, g: 164, b: 255 },
    { r: 178, g: 175, b: 255 }, { r: 187, g: 184, b: 255 }, { r: 195, g: 193, b: 255 }, { r: 211, g: 209, b: 255 },
    { r: 29, g: 41, b: 90 }, { r: 29, g: 56, b: 118 }, { r: 29, g: 72, b: 146 }, { r: 29, g: 92, b: 172 },
    { r: 29, g: 113, b: 198 }, { r: 50, g: 134, b: 207 }, { r: 72, g: 155, b: 217 }, { r: 78, g: 168, b: 236 },
    { r: 85, g: 182, b: 255 }, { r: 105, g: 202, b: 255 }, { r: 116, g: 203, b: 255 }, { r: 130, g: 211, b: 255 },
    { r: 141, g: 218, b: 255 }, { r: 159, g: 212, b: 255 }, { r: 180, g: 226, b: 255 }, { r: 192, g: 235, b: 255 },
    { r: 0, g: 75, b: 89 }, { r: 0, g: 93, b: 110 }, { r: 0, g: 111, b: 132 }, { r: 0, g: 132, b: 156 },
    { r: 0, g: 153, b: 191 }, { r: 0, g: 171, b: 202 }, { r: 0, g: 188, b: 222 }, { r: 0, g: 208, b: 245 },
    { r: 16, g: 220, b: 255 }, { r: 62, g: 225, b: 255 }, { r: 100, g: 231, b: 255 }, { r: 118, g: 234, b: 255 },
    { r: 139, g: 237, b: 255 }, { r: 154, g: 239, b: 255 }, { r: 177, g: 243, b: 255 }, { r: 199, g: 246, b: 255 },
    { r: 0, g: 72, b: 0 }, { r: 0, g: 84, b: 0 }, { r: 3, g: 107, b: 3 }, { r: 14, g: 118, b: 14 },
    { r: 24, g: 128, b: 24 }, { r: 39, g: 146, b: 39 }, { r: 54, g: 164, b: 54 }, { r: 78, g: 185, b: 78 },
    { r: 81, g: 205, b: 81 }, { r: 114, g: 218, b: 114 }, { r: 124, g: 228, b: 124 }, { r: 133, g: 237, b: 133 },
    { r: 153, g: 242, b: 153 }, { r: 179, g: 247, b: 179 }, { r: 195, g: 249, b: 195 }, { r: 205, g: 252, b: 205 },
    { r: 22, g: 64, b: 0 }, { r: 28, g: 83, b: 0 }, { r: 35, g: 102, b: 0 }, { r: 40, g: 120, b: 0 },
    { r: 46, g: 140, b: 0 }, { r: 58, g: 152, b: 12 }, { r: 71, g: 165, b: 25 }, { r: 81, g: 175, b: 35 },
    { r: 92, g: 186, b: 46 }, { r: 113, g: 207, b: 67 }, { r: 133, g: 227, b: 87 }, { r: 141, g: 235, b: 95 },
    { r: 151, g: 245, b: 105 }, { r: 160, g: 254, b: 114 }, { r: 177, g: 255, b: 138 }, { r: 188, g: 255, b: 154 },
    { r: 44, g: 53, b: 0 }, { r: 56, g: 68, b: 0 }, { r: 68, g: 82, b: 0 }, { r: 73, g: 86, b: 0 },
    { r: 96, g: 113, b: 0 }, { r: 108, g: 127, b: 0 }, { r: 121, g: 141, b: 10 }, { r: 139, g: 159, b: 28 },
    { r: 158, g: 178, b: 47 }, { r: 171, g: 191, b: 60 }, { r: 184, g: 204, b: 73 }, { r: 194, g: 214, b: 83 },
    { r: 205, g: 225, b: 83 }, { r: 219, g: 239, b: 108 }, { r: 232, g: 252, b: 121 }, { r: 242, g: 255, b: 171 },
    { r: 70, g: 58, b: 9 }, { r: 77, g: 63, b: 9 }, { r: 84, g: 69, b: 9 }, { r: 108, g: 88, b: 9 },
    { r: 144, g: 118, b: 9 }, { r: 171, g: 139, b: 10 }, { r: 193, g: 161, b: 32 }, { r: 208, g: 176, b: 47 },
    { r: 222, g: 190, b: 61 }, { r: 230, g: 198, b: 69 }, { r: 237, g: 205, b: 76 }, { r: 245, g: 216, b: 98 },
    { r: 251, g: 226, b: 118 }, { r: 252, g: 238, b: 152 }, { r: 253, g: 243, b: 169 }, { r: 253, g: 243, b: 190 },
    { r: 64, g: 26, b: 2 }, { r: 88, g: 31, b: 5 }, { r: 112, g: 36, b: 8 }, { r: 141, g: 58, b: 19 },
    { r: 171, g: 81, b: 31 }, { r: 181, g: 100, b: 39 }, { r: 191, g: 119, b: 48 }, { r: 208, g: 133, b: 58 },
    { r: 225, g: 147, b: 68 }, { r: 237, g: 160, b: 78 }, { r: 249, g: 173, b: 88 }, { r: 252, g: 183, b: 92 },
    { r: 255, g: 193, b: 96 }, { r: 255, g: 202, b: 105 }, { r: 255, g: 207, b: 126 }, { r: 255, g: 218, b: 150 }
];

export class Color {
    constructor(code, palette) {
        this.code = code;
        this.hue = (code & 0xF0) >>> 4;
        this.luminance = code & 0x0F;
        const c = palette[code];
        this.r = c.r;
        this.g = c.g;
        this.b = c.b;
        this.rgb = `rgb(${c.r}, ${c.g}, ${c.b})`;
    }
}

Color.grey = 0x00;
Color.rust = 0x10;
Color.redOrange = 0x20;
Color.darkOrange = 0x30;
Color.red = 0x40;
Color.lavender = 0x50;
Color.cobalt = 0x60;
Color.ultramarine = 0x70;
Color.blue = 0x80;
Color.darkBlue = 0x90;
Color.blueGrey = 0xA0;
Color.olive = 0xB0;
Color.green = 0xC0;
Color.darkGreen = 0xD0;
Color.orangeGreen = 0xE0;
Color.orange = 0xF0;

/**
 * An emulated Antic video coprocessor combined with a GTIA.
 */
export class Antic {
    /**
     * Constructs a new Antic coprocessor.
     * @param {Screen} screen - The screen attached to the computer.
     * @param {MCS6502} cpu - The 6502 CPU of the computer.
     */
    constructor(screen, cpu) {
        this.screen = screen;
        this.cpu = cpu;
        this.displayList = 0x9C20;
        this.dma = 0x7C20;
        this._remainingLines = 0;

        // WSYNC: causes the computer to wait for the next horizontal sync
        this.cpu.setMemoryWriteHandler(0xD40A, () => {
            this.renderScanLine();
        });
        // NMIRES: resets non-maskable interrupt status (NMIST)
        this.cpu.setMemoryWriteHandler(0xD40F, () => {
            this.cpu.memory.poke(0xD40F, 0);
        });
        // Setup default state
        this.cpu.poke(0xD400, 0x32, 0x02);
        this.cpu.poke(0x022F, 0x32);
        this.cpu.poke(0x02F3, 0x02);
        this.cpu.poke(0xD409, 0xE0);
        this.cpu.poke(0x02F4, 0xE0);
    }

    /**
     * DMACTL bits 0 and 1
     */
    get playfieldWidth() {
        return this.cpu.peek(0xD400) & 0x03;
    }
    set playfieldWidth(value) {
        const rest = this.cpu.peek(0xD400) & 0xFC;
        this.cpu.poke(0xD400, rest | (value & 0x03));
    }

    /**
     * DMACTL bit 2
     */
    get missileDMAEnabled() {
        return (this.cpu.peek(0xD400) & 0x04) !== 0;
    }
    set missileDMAEnabled(value) {
        const rest = this.cpu.peek(0xD400) & 0xFB;
        this.cpu.poke(0xD400, value ? rest | 0x04 : rest);
    }

    /**
     * DMACTL bit 3
     */
    get playerDMAEnabled() {
        return (this.cpu.peek(0xD400) & 0x08) !== 0;
    }
    set playerDMAEnabled(value) {
        const rest = this.cpu.peek(0xD400) & 0xF7;
        this.cpu.poke(0xD400, value ? rest | 0x08 : rest);
    }

    /**
     * DMACTL bit 4
     */
    get playerMissileHighResolution() {
        return (this.cpu.peek(0xD400) & 0x10) !== 0
    }
    set playerMissileHighResolution(value) {
        const rest = this.cpu.peek(0xD400) & 0xEF;
        this.cpu.poke(0xD400, value ? rest | 0x10 : rest);
    }

    /**
     * DMACTL bit 5
     */
    get displayListDMAEnabled() {
        return (this.cpu.peek(0xD400) & 0x20) !== 0;
    }
    set displayListDMAEnabled(value) {
        const rest = this.cpu.peek(0xD400) & 0xDF;
        this.cpu.poke(0xD400, value ? rest | 0x20 : rest);
    }

    /**
     * CHACTL
     */
    get characterControl() {
        return this.cpu.peek(0xD401) & 0x07;
    }
    set characterControl(value) {
        this.cpu.poke(0xD401, value & 0x07);
    }

    /**
     * DLISTL/DLISTH
     */
    get displayList() {
        return this.cpu.addressAt(0xD402);
    }
    set displayList(address) {
        address = new Address(address);
        this.cpu.poke(0xD402, address.LSB, address.MSB)
    }

    /**
     * Horizontal fine scrolling in color clock units (equivalent to two pixels in high resolution).
     * Value ranges between 0 and 15.
     * HSCROL bits 0-3
     */
    get horizontalFineScroll() {
        return this.cpu.peek(0xD404) & 0x0F;
    }
    set horizontalFineScroll(value) {
        this.cpu.poke(0xD404, value & 0x0F);
    }

    /**
     * Vertical fine scrolling in scan lines.
     * Value ranges between 0 and 15.
     * VSCROL bits 0-3
     */
    get verticalFineScroll() {
        return this.cpu.peek(0xD405) & 0x0F;
    }
    set verticalFineScroll(value) {
        this.cpu.poke(0xD405, value & 0x0F);
    }

    /**
     * PMBASE
     */
    get playerMissileBase() {
        return new Address(this.cpu.peek(0xD407) << 8);
    }
    set playerMissileBase(value) {
        this.cpu.poke(0xD407, value >>> 8);
    }

    /**
     * CHBASE
     */
    get characterSetBase() {
        return new Address(this.cpu.peek(0xD409) << 8);
    }
    set characterSetBase(value) {
        this.cpu.poke(0xD409, value >>> 8);
    }

    /**
     * VCOUNT * 2
     */
    get verticalLineCounter() {
        return this.cpu.peek(0xD40B) << 1;
    }
    set verticalLineCounter(value) {
        this.cpu.poke(0xD40B, value >>> 1);
    }

    /**
     * PENH
     */
    get penHorizontalPosition() {
        return this.cpu.peek(0xD40C);
    }
    set penHorizontalPosition(value) {
        this.cpu.poke(0xD40C, value);
    }

    /**
     * PENV
     */
    get penVerticalPosition() {
        return this.cpu.peek(0xD40D);
    }
    set penVerticalPosition(value) {
        this.cpu.poke(0xD40D, value);
    }

    /**
     * NMIEN bit 5
     */
    get ResetKeyInterruptEnabled() {
        return (this.cpu.peek(0xD40E) & 0x20) !== 0;
    }
    set ResetKeyInterruptEnabled(value) {
        const rest = this.cpu.peek(0xD40E) & 0xDF;
        this.cpu.poke(0xD40E, value ? rest | 0x20 : rest);
    }

    /**
     * NMIEN bit 6
     */
    get VerticalBlankInterruptEnabled() {
        return (this.cpu.peek(0xD40E) & 0x40) !== 0;
    }
    set VerticalBlankInterruptEnabled(value) {
        const rest = this.cpu.peek(0xD40E) & 0xBF;
        this.cpu.poke(0xD40E, value ? rest | 0x40 : rest);
    }

    /**
     * NMIEN bit 7
     */
    get displayListInterruptEnabled() {
        return (this.cpu.peek(0xD40E) & 0x80) !== 0;
    }
    set displayListInterruptEnabled(value) {
        const rest = this.cpu.peek(0xD40E) & 0x7F;
        this.cpu.poke(0xD40E, value ? rest | 0x80 : rest);
    }

    /**
     * NMIST bit 5
     */
    get ResetKeyInterrupt() {
        return (this.cpu.peek(0xD40F) & 0x20) !== 0;
    }
    set ResetKeyInterrupt(value) {
        const rest = this.cpu.peek(0xD40F) & 0xDF;
        this.cpu.poke(0xD40F, value ? rest | 0x20 : rest);
    }

    /**
     * NMIST bit 6
     */
    get VerticalBlankInterrupt() {
        return (this.cpu.peek(0xD40F) & 0x40) !== 0;
    }
    set VerticalBlankInterrupt(value) {
        const rest = this.cpu.peek(0xD40F) & 0xBF;
        this.cpu.poke(0xD40F, value ? rest | 0x40 : rest);
    }

    /**
     * NMIST bit 7
     */
    get displayListInterrupt() {
        return (this.cpu.peek(0xD40F) & 0x80) !== 0;
    }
    set displayListInterrupt(value) {
        const rest = this.cpu.peek(0xD40F) & 0x7F;
        this.cpu.poke(0xD40F, value ? rest | 0x80 : rest);
    }

    /**
     * The horizontal coordinate of player 0
     */
    get player0Position() {
        return (this.cpu.peek(0xD000));
    }
    set player0Position(value) {
        this.cpu.poke(0xD000, value);
    }

    /**
     * Composition options (graphics priority selector).
     * GPRIOR
     */
    get compositionOptions() {
        return (this.cpu.peek(0xD01B));
    }
    set compositionOptions(value) {
        this.cpu.poke(0xD01B, value);
    }

    /**
     * The color of player 0
     */
    get player0Color() {
        return this.cpu.peek(0xD012);
    }
    set player0Color(color) {
        this.cpu.poke(0xD012, color);
    }

    /**
     * The color of player 1
     */
    get player1Color() {
        return this.cpu.peek(0xD013);
    }
    set player1Color(color) {
        this.cpu.poke(0xD013, color);
    }

    /**
     * The color of player 2
     */
    get player2Color() {
        return this.cpu.peek(0xD014);
    }
    set player2Color(color) {
        this.cpu.poke(0xD014, color);
    }

    /**
     * The color of player 3
     */
    get player3Color() {
        return this.cpu.peek(0xD015);
    }
    set player3Color(color) {
        this.cpu.poke(0xD015, color);
    }

    /**
     * Color 0
     */
    get color0() {
        return this.cpu.peek(0xD016);
    }
    set color0(color) {
        this.cpu.poke(0xD016, color);
    }

    /**
     * Color 1
     */
    get color1() {
        return this.cpu.peek(0xD017);
    }
    set color1(color) {
        this.cpu.poke(0xD017, color);
    }

    /**
     * Color 2
     */
    get color2() {
        return this.cpu.peek(0xD018);
    }
    set color2(color) {
        this.cpu.poke(0xD018, color);
    }

    /**
     * Color 3
     */
    get color3() {
        return this.cpu.peek(0xD019);
    }
    set color3(color) {
        this.cpu.poke(0xD019, color);
    }

    /**
     * The background color (also referred to as Color 4).
     */
    get background() {
        return this.cpu.peek(0xD01A);
    }
    set background(color) {
        this.cpu.poke(0xD01A, color);
    }

    step() {
        const opCode = this.opCode = this.cpu.peek(this.DisplayList);
        const modeCode = this.modeCode = opCode & 0x0F;
        if (modeCode === 0) {
            // blank lines
            this._remainingLines = ((opCode & 0xF0) >>> 4) + 1;
            this.displayList++;
            return;
        }
        if (modeCode === 1) {
            // Jump
            this.displayList = this.cpu.addressAt(this.displayList + 1);
            if (opCode & 0x40) this.screen.verticalSync();
            return;
        }
        this.mode = graphicModes[modeCode];
        this._remainingLines = mode ? mode.pixelHeight : (opCode >>> 4) + 1;
        this.verticalScroll = mode ? (opCode & 0x20) !== 0 : false;
        this.horizontalScroll = mode ? (opCode & 0x10) !== 0 : false;
        this.displayListInterrupt = mode ? (opCode & 0x80) !== 0 : false;
        if (this.loadMemoryScan = mode ? (opCode & 0x40) !== 0 : false) {
            this.dma = this.cpu.addressAt(this.displayList + 1);
            this.displayList += 3;
        }
        else this.displayList++;
    }

    renderScanLine() {
        // Read the next instruction if we're done with the previous one
        if (this._remainingLines == 0) {
            // Advance until we have something to render
            do {
                this.step();
            } while (this.modeCode === 0)
        }
        // render a line
        switch (this.modeCode) {
            case 1: // blank 
                for (let i = 0; i < 48; i++) this.screen.renderByte(0x00, null, this.cpu.background);
                break;
            case 2: 
        }
        this.screen.horizontalSync();
        this._remainingLines--;
        if (this._remainingLines === 0 && this.displayListInterrupt && this.displayListInterruptEnabled) {
            // Display List Interrupt
        }
    }

    verticalSync() {
        // TODO: copy shadow registers
        this.screen.verticalSync();
    }
}

/**
 * Antic graphic modes enumeration
 */
Antic.modes = [
    /* 0 */ null,
    /* 1 */ null,
    /* 2 */ { basic: 0, colors: 2, isText: true, pixelWidth: 8, pixelHeight: 8 },
    /* 3 */ { basic: null, colors: 2, isText: true, pixelWidth: 8, pixelHeight: 10 },
    /* 4 */ { basic: 12, colors: 5, isText: true, pixelWidth: 8, pixelHeight: 8 },
    /* 5 */ { basic: 13, colors: 5, isText: true, pixelWidth: 8, pixelHeight: 16 },
    /* 6 */ { basic: 1, colors: 5, isText: true, pixelWidth: 16, pixelHeight: 8 },
    /* 7 */ { basic: 2, colors: 5, isText: true, pixelWidth: 16, pixelHeight: 16 },
    /* 8 */ { basic: 3, colors: 4, isText: false, pixelWidth: 8, pixelHeight: 8 },
    /* 9 */ { basic: 4, colors: 2, isText: false, pixelWidth: 4, pixelHeight: 4 },
    /* A */ { basic: 5, colors: 4, isText: false, pixelWidth: 4, pixelHeight: 4 },
    /* B */ { basic: 6, colors: 2, isText: false, pixelWidth: 2, pixelHeight: 2 },
    /* C */ { basic: null, colors: 2, isText: false, pixelWidth: 2, pixelHeight: 1 },
    /* D */ { basic: 7, colors: 4, isText: false, pixelWidth: 2, pixelHeight: 2 },
    /* E */ { basic: null, colors: 4, isText: false, pixelWidth: 2, pixelHeight: 1 },
    /* F */ { basic: 8, colors: 2, isText: false, pixelWidth: 1, pixelHeight: 1 }
];

/**
 * Antic display list instruction opcodes.
 */
Antic.displayListInstructions = {
    interrupt: 0x80,
    loadMemoryScan: 0x40,
    verticalScroll: 0x20,
    horizontalScroll: 0x10,
    skip1: 0x00, skip2: 0x10, skip3: 0x20, skip4: 0x30, skip5: 0x40, skip6: 0x50, skip7: 0x60, skip8: 0x70,
    mode2: 0x02, mode3: 0x03, mode4: 0x04, mode5: 0x05, mode6: 0x06, mode7: 0x07, mode8: 0x08, mode9: 0x09,
    mode10: 0x0A, mode11: 0x0B, mode12: 0x0C, mode13: 0x0D, mode14: 0x0E, mode15: 0x0F
};

Antic.playfieldWidth = {
    disabled: 0, // no playfield display
    narrow: 1,   // 128 color clocks / 256 hi-res pixels
    normal: 2,   // 160 color clocks / 320 hi-res pixels
    wide: 3      // 192 color clocks / 384 hi-res pixels
};

Antic.characterControl = {
    blankInverse: 0x01, // Inverse video characters display as blank spaces
    inverse: 0x02,      // Inverse video characters display as inverse video (default)
    reflect: 0x04,      // All characters are displayed vertically mirrored
};

Antic.compositionOptions = {
    playerPlayfield: 1,               // All players are in front of the playfield
    players01Playfieldplayers23: 2,   // Players 0 and 1 are in front, then the playfield, then players 2 and 3
    playfieldPlayers: 4,              // The playfield is in front of players
    playfield01PlayersPlayfield23: 8, // Playfield colors 0 and 1 are in front, then players, then playfield colors 2 and 3
    fifthPlayer: 16,                  // The four missiles are combined to form a fifth player
    coloredOverlap: 32,               // Player overlaps (players 0 and 1, or 2 and 3) are the OR combination of the two player colors
    gtiaMode9: 64,                    // GTIA graphics mode 9
    gtiaMode10: 128,                  // GTIA graphics mode 10
    gtiaMode11: 192                   // GTIA graphics mode 11
};

/**
 * The raw data for the standard Atari character set
 */
const rawCharset = [
    0x00, 0x36, 0x7F, 0x7F, 0x3E, 0x1C, 0x08, 0x00, // 00 ♥
    0x18, 0x18, 0x18, 0x1F, 0x1F, 0x18, 0x18, 0x18, // 01 ├
    0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, // 02 [right 1/4 block]
    0x18, 0x18, 0x18, 0xF8, 0xF8, 0x00, 0x00, 0x00, // 03 ┘
    0x18, 0x18, 0x18, 0xF8, 0xF8, 0x18, 0x18, 0x18, // 04 ┤
    0x00, 0x00, 0x00, 0xF8, 0xF8, 0x18, 0x18, 0x18, // 05 ┐
    0x03, 0x07, 0x0E, 0x1C, 0x38, 0x70, 0xE0, 0xC0, // 06 ╱
    0xC0, 0xE0, 0x70, 0x38, 0x1C, 0x0E, 0x07, 0x03, // 07 ╲
    0x01, 0x03, 0x07, 0x0F, 0x1F, 0x3F, 0x7F, 0xFF, // 08 ◢
    0x00, 0x00, 0x00, 0x00, 0x0F, 0x0F, 0x0F, 0x0F, // 09 ▗
    0x80, 0xC0, 0xE0, 0xF0, 0xF8, 0xFC, 0xFE, 0xFF, // 0A ◣
    0x0F, 0x0F, 0x0F, 0x0F, 0x00, 0x00, 0x00, 0x00, // 0B ▝
    0xF0, 0xF0, 0xF0, 0xF0, 0x00, 0x00, 0x00, 0x00, // 0C ▘
    0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 0D [upper 1/4 block]
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, // 0E ▂
    0x00, 0x00, 0x00, 0x00, 0xF0, 0xF0, 0xF0, 0xF0, // 0F ▖
    0x00, 0x1C, 0x1C, 0x77, 0x77, 0x08, 0x1C, 0x00, // 10 ♣
    0x00, 0x00, 0x00, 0x1F, 0x1F, 0x18, 0x18, 0x18, // 11 ┌
    0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, // 12 ─
    0x18, 0x18, 0x18, 0xFF, 0xFF, 0x18, 0x18, 0x18, // 13 ┼
    0x00, 0x00, 0x3C, 0x7E, 0x7E, 0x7E, 0x3C, 0x00, // 14 ●
    0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, // 15 ▄
    0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, // 16 ▎
    0x00, 0x00, 0x00, 0xFF, 0xFF, 0x18, 0x18, 0x18, // 17 ┬
    0x18, 0x18, 0x18, 0xFF, 0xFF, 0x00, 0x00, 0x00, // 18 ┴
    0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0, // 19 ▌
    0x18, 0x18, 0x18, 0x1F, 0x1F, 0x00, 0x00, 0x00, // 1A └
    0x78, 0x60, 0x78, 0x60, 0x7E, 0x18, 0x1E, 0x00, // 1B ␛ [escape]
    0x00, 0x18, 0x3C, 0x7E, 0x18, 0x18, 0x18, 0x00, // 1C ↑
    0x00, 0x18, 0x18, 0x18, 0x7E, 0x3C, 0x18, 0x00, // 1D ↓
    0x00, 0x18, 0x30, 0x7E, 0x30, 0x18, 0x00, 0x00, // 1E ←
    0x00, 0x18, 0x0C, 0x7E, 0x0C, 0x18, 0x00, 0x00, // 1F →

    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 20 [space]
    0x00, 0x18, 0x18, 0x18, 0x18, 0x00, 0x18, 0x00, // 21 !
    0x00, 0x66, 0x66, 0x66, 0x00, 0x00, 0x00, 0x00, // 22 "
    0x00, 0x66, 0xFF, 0x66, 0x66, 0xFF, 0x66, 0x00, // 23 #
    0x18, 0x3E, 0x60, 0x3C, 0x06, 0x7C, 0x18, 0x00, // 24 $
    0x00, 0x66, 0x6C, 0x18, 0x30, 0x66, 0x46, 0x00, // 25 %
    0x1C, 0x36, 0x1C, 0x38, 0x6F, 0x66, 0x3B, 0x00, // 26 &
    0x00, 0x18, 0x18, 0x18, 0x00, 0x00, 0x00, 0x00, // 27 '
    0x00, 0x0E, 0x1C, 0x18, 0x18, 0x1C, 0x0E, 0x00, // 28 (
    0x00, 0x70, 0x38, 0x18, 0x18, 0x38, 0x70, 0x00, // 29 )
    0x00, 0x66, 0x3C, 0xFF, 0x3C, 0x66, 0x00, 0x00, // 2A *
    0x00, 0x18, 0x18, 0x7E, 0x18, 0x18, 0x00, 0x00, // 2B +
    0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x18, 0x30, // 2C ,
    0x00, 0x00, 0x00, 0x7E, 0x00, 0x00, 0x00, 0x00, // 2D -
    0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x18, 0x00, // 2E .
    0x00, 0x06, 0x0C, 0x18, 0x30, 0x60, 0x40, 0x00, // 2F /

    0x00, 0x3C, 0x66, 0x6E, 0x76, 0x66, 0x3C, 0x00, // 30 0
    0x00, 0x18, 0x38, 0x18, 0x18, 0x18, 0x7E, 0x00, // 31 1
    0x00, 0x3C, 0x66, 0x0C, 0x18, 0x30, 0x7E, 0x00, // 32 2
    0x00, 0x7E, 0x0C, 0x18, 0x0C, 0x66, 0x3C, 0x00, // 33 3
    0x00, 0x0C, 0x1C, 0x3C, 0x6C, 0x7E, 0x0C, 0x00, // 34 4
    0x00, 0x7E, 0x60, 0x7C, 0x06, 0x66, 0x3C, 0x00, // 35 5
    0x00, 0x3C, 0x60, 0x7C, 0x66, 0x66, 0x3C, 0x00, // 36 6
    0x00, 0x7E, 0x06, 0x0C, 0x18, 0x30, 0x30, 0x00, // 37 7
    0x00, 0x3C, 0x66, 0x3C, 0x66, 0x66, 0x3C, 0x00, // 38 8
    0x00, 0x3C, 0x66, 0x3E, 0x06, 0x0C, 0x38, 0x00, // 39 9
    0x00, 0x00, 0x18, 0x18, 0x00, 0x18, 0x18, 0x00, // 3A :
    0x00, 0x00, 0x18, 0x18, 0x00, 0x18, 0x18, 0x30, // 3B ;
    0x06, 0x0C, 0x18, 0x30, 0x18, 0x0C, 0x06, 0x00, // 3C <
    0x00, 0x00, 0x7E, 0x00, 0x00, 0x7E, 0x00, 0x00, // 3D =
    0x60, 0x30, 0x18, 0x0C, 0x18, 0x30, 0x60, 0x00, // 3E >
    0x00, 0x3C, 0x66, 0x0C, 0x18, 0x00, 0x18, 0x00, // 3F ?

    0x00, 0x3C, 0x66, 0x6E, 0x6E, 0x60, 0x3E, 0x00, // 40 @
    0x00, 0x18, 0x3C, 0x66, 0x66, 0x7E, 0x66, 0x00, // 41 A
    0x00, 0x7C, 0x66, 0x7C, 0x66, 0x66, 0x7C, 0x00, // 42 B
    0x00, 0x3C, 0x66, 0x60, 0x60, 0x66, 0x3C, 0x00, // 43 C
    0x00, 0x78, 0x6C, 0x66, 0x66, 0x6C, 0x78, 0x00, // 44 D
    0x00, 0x7E, 0x60, 0x7C, 0x60, 0x60, 0x7E, 0x00, // 45 E
    0x00, 0x7E, 0x60, 0x7C, 0x60, 0x60, 0x60, 0x00, // 46 F
    0x00, 0x3E, 0x60, 0x60, 0x6E, 0x66, 0x3E, 0x00, // 47 G
    0x00, 0x66, 0x66, 0x7E, 0x66, 0x66, 0x66, 0x00, // 48 H
    0x00, 0x7E, 0x18, 0x18, 0x18, 0x18, 0x7E, 0x00, // 49 I
    0x00, 0x06, 0x06, 0x06, 0x06, 0x66, 0x3C, 0x00, // 4A J
    0x00, 0x66, 0x6C, 0x78, 0x78, 0x6C, 0x66, 0x00, // 4B K
    0x00, 0x60, 0x60, 0x60, 0x60, 0x60, 0x7E, 0x00, // 4C L
    0x00, 0x63, 0x77, 0x7F, 0x6B, 0x63, 0x63, 0x00, // 4D M
    0x00, 0x66, 0x76, 0x7E, 0x7E, 0x6E, 0x66, 0x00, // 4E N
    0x00, 0x3C, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x00, // 4F O
    0x00, 0x7C, 0x66, 0x66, 0x7C, 0x60, 0x60, 0x00, // 50 P
    0x00, 0x3C, 0x66, 0x66, 0x66, 0x6C, 0x36, 0x00, // 51 Q
    0x00, 0x7C, 0x66, 0x66, 0x7C, 0x6C, 0x66, 0x00, // 52 R
    0x00, 0x3C, 0x60, 0x3C, 0x06, 0x06, 0x3C, 0x00, // 53 S
    0x00, 0x7E, 0x18, 0x18, 0x18, 0x18, 0x18, 0x00, // 54 T
    0x00, 0x66, 0x66, 0x66, 0x66, 0x66, 0x7E, 0x00, // 55 U
    0x00, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x18, 0x00, // 56 V
    0x00, 0x63, 0x63, 0x6B, 0x7F, 0x77, 0x63, 0x00, // 57 W
    0x00, 0x66, 0x66, 0x3C, 0x3C, 0x66, 0x66, 0x00, // 58 X
    0x00, 0x66, 0x66, 0x3C, 0x18, 0x18, 0x18, 0x00, // 59 Y
    0x00, 0x7E, 0x0C, 0x18, 0x30, 0x60, 0x7E, 0x00, // 5A Z
    0x00, 0x1E, 0x18, 0x18, 0x18, 0x18, 0x1E, 0x00, // 5B [
    0x00, 0x40, 0x60, 0x30, 0x18, 0x0C, 0x06, 0x00, // 5C \
    0x00, 0x78, 0x18, 0x18, 0x18, 0x18, 0x78, 0x00, // 5D ]
    0x00, 0x08, 0x1C, 0x36, 0x63, 0x00, 0x00, 0x00, // 5E ^
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0x00, // 5F _

    0x00, 0x18, 0x3C, 0x7E, 0x7E, 0x3C, 0x18, 0x00, // 60 ♦
    0x00, 0x00, 0x3C, 0x06, 0x3E, 0x66, 0x3E, 0x00, // 61 a
    0x00, 0x60, 0x60, 0x7C, 0x66, 0x66, 0x7C, 0x00, // 62 b
    0x00, 0x00, 0x3C, 0x60, 0x60, 0x60, 0x3C, 0x00, // 63 c
    0x00, 0x06, 0x06, 0x3E, 0x66, 0x66, 0x3E, 0x00, // 64 d
    0x00, 0x00, 0x3C, 0x66, 0x7E, 0x60, 0x3C, 0x00, // 65 e
    0x00, 0x0E, 0x18, 0x3E, 0x18, 0x18, 0x18, 0x00, // 66 f
    0x00, 0x00, 0x3E, 0x66, 0x66, 0x3E, 0x06, 0x7C, // 67 g
    0x00, 0x60, 0x60, 0x7C, 0x66, 0x66, 0x66, 0x00, // 68 h
    0x00, 0x18, 0x00, 0x38, 0x18, 0x18, 0x3C, 0x00, // 69 i
    0x00, 0x06, 0x00, 0x06, 0x06, 0x06, 0x06, 0x3C, // 6A j
    0x00, 0x60, 0x60, 0x6C, 0x78, 0x6C, 0x66, 0x00, // 6B k
    0x00, 0x38, 0x18, 0x18, 0x18, 0x18, 0x3C, 0x00, // 6C l
    0x00, 0x00, 0x66, 0x7F, 0x7F, 0x6B, 0x63, 0x00, // 6D m
    0x00, 0x00, 0x7C, 0x66, 0x66, 0x66, 0x66, 0x00, // 6E n
    0x00, 0x00, 0x3C, 0x66, 0x66, 0x66, 0x3C, 0x00, // 6F o
    0x00, 0x00, 0x7C, 0x66, 0x66, 0x7C, 0x60, 0x60, // 70 p
    0x00, 0x00, 0x3E, 0x66, 0x66, 0x3E, 0x06, 0x06, // 71 q
    0x00, 0x00, 0x7C, 0x66, 0x60, 0x60, 0x60, 0x00, // 72 r
    0x00, 0x00, 0x3E, 0x60, 0x3C, 0x06, 0x7C, 0x00, // 73 s
    0x00, 0x18, 0x7E, 0x18, 0x18, 0x18, 0x0E, 0x00, // 74 t
    0x00, 0x00, 0x66, 0x66, 0x66, 0x66, 0x3E, 0x00, // 75 u
    0x00, 0x00, 0x66, 0x66, 0x66, 0x3C, 0x18, 0x00, // 76 v
    0x00, 0x00, 0x63, 0x6B, 0x7F, 0x3E, 0x36, 0x00, // 77 w
    0x00, 0x00, 0x66, 0x3C, 0x18, 0x3C, 0x66, 0x00, // 78 x
    0x00, 0x00, 0x66, 0x66, 0x66, 0x3E, 0x0C, 0x78, // 79 y
    0x00, 0x00, 0x7E, 0x0C, 0x18, 0x30, 0x7E, 0x00, // 7A z
    0x00, 0x18, 0x3C, 0x7E, 0x7E, 0x18, 0x3C, 0x00, // 7B ♠
    0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, // 7C |
    0x00, 0x7E, 0x78, 0x7C, 0x6E, 0x66, 0x06, 0x00, // 7D ↰
    0x08, 0x18, 0x38, 0x78, 0x38, 0x18, 0x08, 0x00, // 7E ◀
    0x10, 0x18, 0x1C, 0x1E, 0x1C, 0x18, 0x10, 0x00, // 7F ▶
];

/**
 * The standard Atari character set
 */
export const charset = new Array(256);

for (let i = 0; i < 128; i++) {
    const o = i * 8;
    charset[i] = [
        rawCharset[o], rawCharset[o + 1], rawCharset[o + 2], rawCharset[o + 3],
        rawCharset[o + 4], rawCharset[o + 5], rawCharset[o + 6], rawCharset[o + 7]
    ];
    charset[i + 128] = charset[i].map(byte => byte ^ 0xFF);
}

const zeroToSeven = [0, 1, 2, 3, 4, 5, 6, 7];
const bitsHighToLow = zeroToSeven.map(n => 0x80 >>> n);

const formatByte = byte => bitsHighToLow.map(bit => (byte & bit) == 0 ? '□' : '■').join(' ');

const dumpCharset = (charset) => {
    for (let code = 0; code < 255; code += 8) {
        var scanLines = zeroToSeven.map(
            byte => zeroToSeven.map(
                offset => formatByte(charset[code + offset][byte])
            ).join('  ')
        );
        scanLines.forEach(scanLine => console.log(scanLine));
        console.log();
    }
}
