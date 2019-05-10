import MCS6502, { Address } from '../../6502';

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