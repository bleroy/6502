import Atari, {CanvasScreen, palette, charset} from '../../libs/systems/atari/atari.js';

const screen = new CanvasScreen(document.getElementById('screen'), 1, 1, 2);
const atari900XS = new Atari(screen, palette);
const colors = atari900XS.colors;
for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
        screen.paint(i, j, colors[i * 16 + j]);
    }
}
const t1 = new Date();
for (let c = 0; c < 256; c++) {
    screen.drawChar((c % 32) * 8 + 32, Math.floor(c / 32) * 8, charset[c], colors[c]);
}
const t2 = new Date();
console.log(t2 - t1);