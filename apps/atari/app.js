import Atari, {CanvasScreen, palette} from '../../libs/systems/atari/atari.js';

const screen = new CanvasScreen(document.getElementById('screen'), 1, 1, 2);
const atari900XS = new Atari(screen, palette);
const colors = atari900XS.colors;
for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
        atari900XS.screen.paint(i, j, colors[i * 16 + j]);
    }
}
