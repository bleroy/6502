import Atari, {CanvasScreen, palette, charset} from '../../libs/systems/atari/atari.js';

const screen = new CanvasScreen(document.getElementById('screen'), 2);

const atari900XS = new Atari(screen, palette);
const colors = atari900XS.colors;

const t1 = new Date();
for (let i = 0; i < 192; i++) {
    screen.clearScanLine(colors[255 - i]);
    for (let j = 0; j < 16; j++) {
        screen.paint(j, colors[(i % 16) * 16 + j]);
    }
    for (let c = 0; c < 32; c++) {
        screen.drawCharLine(c * 8 + 32, charset[c + Math.floor((i % 64) / 8) * 32][i % 8], colors[c]);
    }
    screen.paintScanLine();
}
screen.displayScreen();
const t2 = new Date();
console.log(`${Math.round(1000/(t2 - t1))} fps`);