const { funcidx, tableidx, memidx, globalidx } = require("./indices");
const { vec, name, ubyte } = require("./globals");

const EXPORTTYPE = {
    funcidx:   { value: { hex: 0x0 } },
    tableidx:  { value: { hex: 0x1 } },
    memidx:    { value: { hex: 0x2 } },
    globalidx: { value: { hex: 0x3 } },
};

function exportdesc(data, i){
    let pointer = i;

    const magic = ubyte(data, pointer);
    pointer += magic.bytes;
    
    let export_result = null;
    switch(magic.value){
        case EXPORTTYPE.funcidx.value.hex  : 
            const x_functidx = funcidx(data, pointer);
            pointer += x_functidx.bytes;
            export_result = x_functidx.value;
        break;
        case EXPORTTYPE.tableidx.value.hex :
            const x_tableidx = tableidx(data, pointer);
            pointer += x_tableidx.bytes;
            export_result = x_tableidx.value;    
        break;
        case EXPORTTYPE.memidx.value.hex   :
            const x_memidx = memidx(data, pointer);
            pointer += x_memidx.bytes;
            export_result = x_memidx.value;
        break;
        case EXPORTTYPE.globalidx.value.hex:
            const x_globalidx = globalidx(data, pointer);
            pointer += x_globalidx.bytes;
            export_result = x_globalidx.value;
        break;
        default: throw `EXPORTYPE ${toHex(magic.value)} Not found, expected ${Object.entries(EXPORTTYPE).map(e => `${e[0]} (${toHex(e[1].value.hex)})`).join(" or ")}`;
    }

    return {
        value: export_result,
        bytes: pointer - i
    };
}

function export_wasm(data, i){
    let pointer = i;

    // Name Entity inside Module
    const nm = name(data, pointer);
    pointer += nm.bytes;

    const d = exportdesc(data, pointer);
    pointer += d.bytes;

    return {
        value: { name: nm.value, desc: d.value },
        bytes: pointer - i
    };
}

function exportsec(data, i){
    let pointer = i;
    
    let section = vec(data, pointer, export_wasm);
    pointer += section.bytes;

    return {
        value: section.value,
        bytes: pointer - i
    };
}

module.exports = { exportsec };