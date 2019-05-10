import Atari, {palette, charset} from '../../libs/systems/atari/atari.js';
import {CanvasScreen} from '../../libs/systems/atari/screen.js';
import {Antic} from '../../libs/systems/atari/antic.js';

const screen = new CanvasScreen(document.getElementById('screen'), 2);

const atari900XS = new Atari(screen, palette);
const antic = atari900XS.antic;
const colors = atari900XS.colors;
const dli = Antic.displayListInstructions;

function renderImpossibleFrame(frame) {
    const t1 = new Date();
    for (let i = 0; i < 192; i++) {
        // Full palette rendered on the left of the screen
        const background = colors[(i + frame) % 256];
        for (let j = 0; j < 16; j++) {
            screen.renderPixel(colors[(i % 16) * 16 + j]);
        }
        // 24 pixels of background
        screen.renderByte(0x00, null, background);
        screen.renderByte(0x00, null, background);
        screen.renderByte(0x00, null, background);
        // Render the character set, cycling colors
        for (let c = 0; c < 32; c++) {
            const char = c + Math.floor((i % 64) / 8) * 32;
            screen.renderByte(charset[char][i % 8], colors[char], background);
        }
        // 24 more pixels of background
        screen.renderByte(0x00, null, background);
        screen.renderByte(0x00, null, background);
        screen.renderByte(0x00, null, background);
        screen.horizontalSync();
    }
    screen.verticalSync();
    const t2 = new Date();
    return Math.round(1000/(t2 - t1));
}

const fpsSpan = document.getElementById('fps');

function displayFps(fps) {
    fpsSpan.innerText = fps;
}

const renderImpossibleFramesButton = document.getElementById('renderImpossibleFramesButton');
renderImpossibleFramesButton.addEventListener('click', () => {
    const perf = [];
    let f = 0;
    
    let callback = () => {
        if (f < 100) {
            const fps = renderImpossibleFrame(f);
            perf.push(fps);
            displayFps(fps);
            f++;
            setTimeout(callback, 1000/60);
        }
        else {
            const averageFps = Math.round(perf.reduce((p, c) => p + c, 0) / perf.length);
            displayFps(averageFps);
            console.log(`Average fps: ${averageFps}`);
        }
    };
    setTimeout(callback, 0);
});

const renderMode2 = document.getElementById('renderMode2Screen');
renderMode2.addEventListener('click', () => {
    const lipsum =
        "LOREM IPSUM         " +
        "Lorem ipsum dolor sit amet, consectetur " +
        "adipiscing elit, sed do eiusmod tempor  " +
        "incididunt ut labore et dolore magna    " +
        "aliqua. Ut enim ad minim veniam, quis   " +
        "nostrud exercitation ullamco laboris    " +
        "nisi ut aliquip ex ea commodo consequat." +
        "Duis aute irure dolor in reprehenderit  " +
        "in voluptate velit esse cillum dolore eu" +
        "fugiat nulla pariatur. Excepteur sint   " +
        "occaecat cupidatat non proident, sunt in" +
        "culpa qui officia deserunt mollit anim  " +
        "id est laborum.                         " +
        "                                        " +
        "Sed ut perspiciatis unde omnis iste     " +
        "natus error sit voluptatem accusantium  " +
        "doloremque laudantium, totam rem        " +
        "aperiam, eaque ipsa quae ab illo        " +
        "inventore veritatis et quasi architecto " +
        "beatae vitae dicta sunt explicabo. Nemo " +
        "enim ipsam voluptatem quia voluptas sit " +
        "aspernatur aut odit aut fugit, sed quia " +
        "consequuntur magni dolores eos qui      " +
        "ratione voluptatem sequi nesciunt. Neque" +
        "porro quisquam est, qui dolorem ipsum   " +
        "quia dolor sit amet, consectetur,       " +
        "adipisci velit, sed quia non numquam    " +
        "eius modi tempora incidunt ut labore et " +
        "dolore magnam aliquam quaerat           " +
        "voluptatem. Ut enim ad minima veniam,   " +
        "quis nostrum exercitationem ullam       " +
        "corporis suscipit laboriosam, nisi ut   " +
        "aliquid ex ea commodi consequatur? Quis " +
        "autem vel eum iure reprehenderit qui in " +
        "ea voluptate velit esse quam nihil      " +
        "molestiae consequatur, vel illum qui    " +
        "dolorem eum fugiat quo voluptas nulla   " +
        "pariatur?                               ";

    atari900XS.pokeString(0x800, lipsum);
    atari900XS.poke(antic.displayList,
        dli.skip8, dli.skip8, dli.skip8,             // Three blank lines
        dli.mode7 | dli.loadMemoryScan, 0x00, 0x08,  // Screen memory starts on our Lorem Ipsum non-scrolling title line
        dli.skip2,                                   // followed by two blank scan lines
        dli.mode2 | dli.verticalScroll,              // 22 lines of vertically scrolling small text
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,
        dli.mode2 | dli.verticalScroll,              // + one extra scroll buffer line
        dli.jumpVerticalBlank, antic.displayList.MSB, antic.displayList.LSB); // Back to the top.

    atari900XS.antic.renderFrame();
});