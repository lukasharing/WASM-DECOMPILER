
// https://webassembly.github.io/spec/core/binary/modules.html#binary-importsec

const {ubyte, u32, vec, functype, import_wasm, export_wasm, typeidx, table, mem, global, elem, code, data_wasm } = require("./globals");
const {toHex} = require("./helper");
const { wasm_2_string } = require("./wasm_2_string");

const fs = require('fs');

//const name = "habbo2020";
//const wasm_buffer = fs.readFileSync(name);
const name = "./examples/code-2";
const wasm_buffer = Buffer.from(fs.readFileSync(name, "ascii"), "base64");

const MAGIC_UINT32 = Buffer.from("\0asm", "ascii").readUInt32LE(0);

const DECOMPILE = {
    HEADER: 0x1,
    SECTION: 0x2
};

const SECTION = {
    CUSTOM:   { value: { hex: 0x0, name: "custom"   } },
    TYPE:     { value: { hex: 0x1, name: "type"     } },
    IMPORT:   { value: { hex: 0x2, name: "import"   } },
    FUNCTION: { value: { hex: 0x3, name: "func" } },
    TABLE:    { value: { hex: 0x4, name: "table"    } },
    MEMORY:   { value: { hex: 0x5, name: "memory"   } },
    GLOBAL:   { value: { hex: 0x6, name: "global"   } },
    EXPORT:   { value: { hex: 0x7, name: "export"   } },
    START:    { value: { hex: 0x8, name: "start"    } },
    ELEMENT:  { value: { hex: 0x9, name: "elem"  } },
    CODE:     { value: { hex: 0xA, name: "code"     } },
    DATA:     { value: { hex: 0xB, name: "data"     } }
};

const MAGIC_FUNCTION_TYPES = 0x60;

let decompile_pointer = 0;
let decompile_step = DECOMPILE.HEADER;

const decompilation = new Array();
while(decompile_pointer < wasm_buffer.length){
    try{
        switch(decompile_step){
            case DECOMPILE.HEADER:
                const data_header = decompile_header(wasm_buffer, decompile_pointer);
                decompile_pointer += data_header.bytes;
                decompile_step = DECOMPILE.SECTION;
            break;
            case DECOMPILE.SECTION:
                const data_section = decompile_section(wasm_buffer, decompile_pointer);
                decompilation.push(data_section.value);
                //if(data_section.value.name === "elem") decompile_pointer += 1 << 30;
                decompile_pointer += data_section.bytes;
            break;
        }
    }catch(e){
        console.error(e);
        break;
    }
}
console.log("------------------");
const wasm_string = wasm_2_string(decompilation);
//console.log(wasm_string);

fs.writeFileSync(`${name}-decompiled.wasm`, wasm_string);

function decompile_header(data, i){
    let pointer = i;

    const header = data.readUInt32LE(pointer);
    if(MAGIC_UINT32 !== header) throw `Not WASM FILE`;
    pointer += 4;
    
    const version = data.readUInt32LE(pointer);
    if(version !== 0x00000001) throw `WASM VERSION NOT `;
    pointer += 4;

    return {
        value: { header: header.value, version: version.value },
        bytes: pointer - i
    };
}

function decompile_section(data, i){
    let pointer = i;

    let id = ubyte(data, pointer);
    pointer += id.bytes;

    let length = u32(data, pointer);
    pointer += length.bytes;

    let data_section = null;
    switch(id.value){
        case SECTION.CUSTOM.value.hex   : data_section = Object.assign(customsec(data, pointer), SECTION.CUSTOM.value  ); break;
        case SECTION.TYPE.value.hex     : data_section = Object.assign(typesec(data, pointer),   SECTION.TYPE.value    ); break;
        case SECTION.IMPORT.value.hex   : data_section = Object.assign(importsec(data, pointer), SECTION.IMPORT.value  ); break;
        case SECTION.FUNCTION.value.hex : data_section = Object.assign(funcsec(data, pointer),   SECTION.FUNCTION.value); break;
        case SECTION.TABLE.value.hex    : data_section = Object.assign(tablesec(data, pointer),  SECTION.TABLE.value   ); break;
        case SECTION.MEMORY.value.hex   : data_section = Object.assign(memsec(data, pointer),    SECTION.MEMORY.value  ); break;
        case SECTION.GLOBAL.value.hex   : data_section = Object.assign(globalsec(data, pointer), SECTION.GLOBAL.value  ); break;
        case SECTION.EXPORT.value.hex   : data_section = Object.assign(exportsec(data, pointer), SECTION.EXPORT.value  ); break;
        case SECTION.START.value.hex    : throw `Not Implemented SECTION START`;   break;
        case SECTION.ELEMENT.value.hex  : data_section = Object.assign(elemsec(data, pointer), SECTION.ELEMENT.value   ); break;
        case SECTION.CODE.value.hex     : data_section = Object.assign(codesec(data, pointer), SECTION.CODE.value      ); break;
        case SECTION.DATA.value.hex     : data_section = Object.assign(datasec(data, pointer), SECTION.DATA.value      ); break;
        default: throw `Not Implemented SECTION ${toHex(id.value)}`;
    }
    
    console.log(`${data_section.name.padStart(8, ' ')}\t start: ${toHex(pointer, 8)}\t end: ${toHex(pointer + length.value, 8)}\t size: ${toHex(length.value, 8)}\t count: ${data_section.value.length}`);
    if(length.value !== data_section.bytes){
        throw `Section byte size does not match with section length.`;
    }
    pointer += data_section.bytes;

    return {
        value: data_section,
        bytes: pointer - i
    };
}