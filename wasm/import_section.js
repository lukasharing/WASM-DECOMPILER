const IMPORTTYPE = {
    typeidx:    { value: { hex: 0x0 } },
    tabletype:  { value: { hex: 0x1 } },
    memtype:    { value: { hex: 0x2 } },
    globaltype: { value: { hex: 0x3 } },
};

function importdesc(data, i){
    let pointer = i;

    const magic = ubyte(data, pointer);
    pointer += magic.bytes;

    let importdesc_result = null;
    switch(magic.value){
        case IMPORTTYPE.typeidx.value.hex: 
            const x = typeidx(data, pointer);
            pointer += x.bytes;

            importdesc_result = x.value;
        break;
        case IMPORTTYPE.tabletype.value.hex: 
            const tt = tabletype(data, pointer);
            pointer += tt.bytes;

            importdesc_result = tt.value;
        break;
        case IMPORTTYPE.memtype.value.hex:
            const mt = memtype(data, pointer);
            pointer += mt.bytes;

            importdesc_result = mt.value;
        break;
        case IMPORTTYPE.globaltype.value.hex:

            const gt = globaltype(data, pointer);
            pointer += gt.bytes;

            importdesc_result = gt.value;
        break;
        default: throw `IMPORTYPE ${toHex(magic.value)} Not found, expected ${Object.entries(IMPORTTYPE).map(e => `${e[0]} (${toHex(e[1].value.hex)})`).join(" or ")}`;
    }

    return {
        value: importdesc_result, 
        bytes: pointer - i
    };
}

function import_wasm(data, i){
    let pointer = i;
    // Module Name
    const mod = name(data, pointer);
    pointer += mod.bytes;

    // Name Entity inside Module
    const nm = name(data, pointer);
    pointer += nm.bytes;

    // Descriptor Tag
    const d = importdesc(data, pointer);
    pointer += d.bytes;

    return {
        value: {module: mod.value, name: nm.value, desc: d.value},
        bytes: pointer - i
    };
}

function importsec(data, i){
    let pointer = i;
    
    let section = vec(data, pointer, import_wasm);
    pointer += section.bytes;

    return {
        value: section.value,
        bytes: pointer - i
    };
}

module.exports = { importsec };