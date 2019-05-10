import MCS6502, { Address } from '../../6502';

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
        this.displayList = new Address(0x9C20);
        this.dma = new Address(0x7C20);
        this._remainingLines = 0;
        this.modeCode = 0;

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
     * The Antic graphic mode for the current scan line.
     */
    get mode() {
        return Antic.modes[this.modeCode];
    }

    /**
     * Playfield width.
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
     * The width of the current scan line in screen pixels
     * (256 / 320 / 384 screen pixels).
     */
    get screenLineWidth() {
        return 192 + 64 * this.playfieldWidth;
    }

    /**
     * The width of the current scan line in the current mode's pixel unit
     * (can be chars for text modes).
     */
    get pixelLineWidth() {
        return this.screenLineWidth / this.mode.pixelWidth;
    }

    /**
     * Missile DMA enabled.
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
     * Player DMA enabled.
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
     * Player missiles are rendered in high resolution.
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
     * Display list DMA enabled.
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
     * Character control.
     * CHACTL
     */
    get characterControl() {
        return this.cpu.peek(0xD401) & 0x07;
    }
    set characterControl(value) {
        this.cpu.poke(0xD401, value & 0x07);
    }

    /**
     * Display list pointer.
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
     * Player missile base address.
     * PMBASE
     */
    get playerMissileBase() {
        return new Address(this.cpu.peek(0xD407) << 8);
    }
    set playerMissileBase(value) {
        this.cpu.poke(0xD407, value >>> 8);
    }

    /**
     * Character set base address.
     * CHBASE
     */
    get characterSetBase() {
        return new Address(this.cpu.peek(0xD409) << 8);
    }
    set characterSetBase(value) {
        this.cpu.poke(0xD409, value >>> 8);
    }

    /**
     * Vertical line counter (has a resolution of 2 lines).
     * VCOUNT * 2
     */
    get verticalLineCounter() {
        return this.cpu.peek(0xD40B) << 1;
    }
    set verticalLineCounter(value) {
        this.cpu.poke(0xD40B, value >>> 1);
    }

    /**
     * Light pen horizontal position (mapped mouse position in emulator).
     * PENH
     */
    get penHorizontalPosition() {
        return this.cpu.peek(0xD40C);
    }
    set penHorizontalPosition(value) {
        this.cpu.poke(0xD40C, value);
    }

    /**
     * Light pen vertical position (mapped mouse position in emulator).
     * PENV
     */
    get penVerticalPosition() {
        return this.cpu.peek(0xD40D);
    }
    set penVerticalPosition(value) {
        this.cpu.poke(0xD40D, value);
    }

    /**
     * Reset key interrupt enabled.
     * NMIEN bit 5
     */
    get resetKeyInterruptEnabled() {
        return (this.cpu.peek(0xD40E) & 0x20) !== 0;
    }
    set resetKeyInterruptEnabled(value) {
        const rest = this.cpu.peek(0xD40E) & 0xDF;
        this.cpu.poke(0xD40E, value ? rest | 0x20 : rest);
    }

    /**
     * Vertical blank interrupts enabled.
     * NMIEN bit 6
     */
    get verticalBlankInterruptEnabled() {
        return (this.cpu.peek(0xD40E) & 0x40) !== 0;
    }
    set verticalBlankInterruptEnabled(value) {
        const rest = this.cpu.peek(0xD40E) & 0xBF;
        this.cpu.poke(0xD40E, value ? rest | 0x40 : rest);
    }

    /**
     * Display list interrupts enabled.
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
     * Reset key interrupt.
     * NMIST bit 5
     */
    get resetKeyInterrupt() {
        return (this.cpu.peek(0xD40F) & 0x20) !== 0;
    }
    set resetKeyInterrupt(value) {
        const rest = this.cpu.peek(0xD40F) & 0xDF;
        this.cpu.poke(0xD40F, value ? rest | 0x20 : rest);
    }

    /**
     * Vertical blank interrupt.
     * NMIST bit 6
     */
    get verticalBlankInterrupt() {
        return (this.cpu.peek(0xD40F) & 0x40) !== 0;
    }
    set verticalBlankInterrupt(value) {
        const rest = this.cpu.peek(0xD40F) & 0xBF;
        this.cpu.poke(0xD40F, value ? rest | 0x40 : rest);
    }

    /**
     * Display list interrupt.
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
     * The horizontal coordinate of player 0.
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

    /**
     * Executes a single display list instruction.
     * Prefer `renderScanLine` or `renderFrame`.
     * @param {Boolean} resetRemainingLines if true, keeps remaining lines the same (useful for fine scrolling)
     */
    step(resetRemainingLines) {
        const opCode = this.opCode = this.cpu.peek(this.displayList);
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

    /**
     * Renders a single scan line for the screen, according to the display list.
     */
    renderScanLine() {
        // Read the next instruction if we're done with the previous one
        if (this._remainingLines == 0) {
            // Advance until we have something to render
            do {
                this.step();
            } while (this.modeCode === 0)
        }
        if (this.playfieldWidth > 0) {
            const mode = this.mode;
            const pixelLineWidth = this.pixelLineWidth;
            const scanLineInModeLine = mode.pixelHeight - this._remainingLines;
            // render a line
            switch (this.modeCode) {
                case 1: // blank 
                    for (let i = 0; i < 48; i++) this.screen.renderByte(0x00, null, this.cpu.background);
                    break;
                case 2: case 3: case 4: case 5: case 6: case 7: // text
                    for (let i = 0; i < pixelLineWidth; i++) {
                        // If vertical scrolling is enabled, and we're below the bottom of the current line,
                        // we need to advance to the next line in the display list.
                        if (this.verticalScroll && scanLineInModeLine > this.verticalFineScroll) {
                            this.step();
                            // TODO: check if still a text line with fine scroll enabled
                        }
                        const ch = this.cpu.peek(this.dma.valueOf() + i);
                    }
            }
        }
        // TODO: player missiles
        this.screen.horizontalSync();
        this._remainingLines--;
        if (this._remainingLines === 0 && this.displayListInterrupt && this.displayListInterruptEnabled) {
            // TODO: Display List Interrupt
        }
    }

    /**
     * Renders an entire screen.
     * This works by rendering scan lines until vertical sync is reached.
     */
    renderFrame() {
        do {
            this.renderScanLine();
        } while (this.screen.verticalPosition > 0)
    }

    /**
     * Triggers a vertical sync on the screen.
     * This should mormally not be called directly, and does not reset the display list.
     */
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
    jump: 0x01,
    jumpVerticalBlank: 0x41,
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