import Atari, {CanvasScreen, palette, charset} from '../../libs/systems/atari/atari.js';

const screen = new CanvasScreen(document.getElementById('screen'), 2);

const atari900XS = new Atari(screen, palette);
const colors = atari900XS.colors;

const t1 = new Date();
for (let i = 0; i < 192; i++) {
    const background = colors[i % 256];
    for (let j = 0; j < 16; j++) {
        screen.renderPixel(colors[(i % 16) * 16 + j]);
    }
    screen.renderByte(0x00, null, background);
    screen.renderByte(0x00, null, background);
    screen.renderByte(0x00, null, background);
    for (let c = 0; c < 32; c++) {
        const char = c + Math.floor((i % 64) / 8) * 32;
        screen.renderByte(charset[char][i % 8], colors[char], background);
    }
    screen.renderByte(0x00, null, background);
    screen.renderByte(0x00, null, background);
    screen.renderByte(0x00, null, background);
    screen.horizontalSync();
}
screen.verticalSync();
const t2 = new Date();
console.log(`${Math.round(1000/(t2 - t1))} fps`);