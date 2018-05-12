'use strict';

// Usage: npx babel-node romdump command param1 param2 path
// command:
//  * dump: dump param2 (hex, rounded at the closest multiple of 8) bytes from the contents of the file starting at the specified hex offset
//  * find: finds the hex pattern expressed by param1, starting at hex index param2, in the specified file

import fs from "fs";

const args = process.argv;
const [command, param1, param2, path] = args.slice(-4);

const rom = fs.readFileSync(path);

switch(command) {
    case "dump": {
        const start = parseInt(param1, 16);
        const length = parseInt(param2, 16);
        for (let i = start; i < rom.byteLength && i < start + length; i += 8) {
            console.log([...rom.slice(i, i + 8).values()].map(byte => `0x${byte.toString(16).toUpperCase().padStart(2, '0')},`).join(' '));
        }
        //console.log(`${command} ${start} ${length} ${path}`);
        break;
    }

    case "find": {
        const pattern = new Uint8Array(param1.match(/.{1,2}/g).map(o => parseInt(o, 16)));
        const start = parseInt(param2, 16);
        const index = rom.indexOf(pattern, start);
        if (index == -1) console.log('$FFFF');
        else console.log('0x' + index.toString(16).toUpperCase().padStart(4, '0'));
    }
}
