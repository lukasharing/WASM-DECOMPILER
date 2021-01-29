const { u32 } = require("./globals");

const INDEXTYPE = {
    typeidx:   { value: { type: "typeidx"   } },
    funcidx:   { value: { type: "funcidx"   } },
    tableidx:  { value: { type: "tableidx"  } },
    memidx:    { value: { type: "memidx"    } },
    globalidx: { value: { type: "globalidx" } },
    localidx:  { value: { type: "localidx"  } },
    labelidx:  { value: { type: "labelidx"  } },
};

function funcidx(data, i){
    let pointer = i;

    let idx = u32(data, pointer);
    pointer += idx.bytes;

    return {
        value: {
            i: idx.value,
            type: INDEXTYPE.funcidx.value.type
        }, 
        bytes: pointer - i
    };
}

function labelidx(data, i){
    let pointer = i;

    let idx = u32(data, pointer);
    pointer += idx.bytes;

    return {
        value: {
            i: idx.value,
            type: INDEXTYPE.labelidx.value.type
        }, 
        bytes: pointer - i
    };
}

function typeidx(data, i){
    let pointer = i;

    let idx = u32(data, pointer);
    pointer += idx.bytes;

    return {
        value: {
            i: idx.value,
            type: INDEXTYPE.typeidx.value.type
        }, 
        bytes: pointer - i
    };
}

function tableidx(data, i){
    let pointer = i;

    let idx = u32(data, pointer);
    pointer += idx.bytes;

    return {
        value: {
            i: idx.value,
            type: INDEXTYPE.tableidx.value.type
        }, 
        bytes: pointer - i
    };
}

function memidx(data, i){
    let pointer = i;

    let idx = u32(data, pointer);
    pointer += idx.bytes;

    return {
        value: {
            i: idx.value,
            type: INDEXTYPE.memidx.value.type
        }, 
        bytes: pointer - i
    };
}

function localidx(data, i){
    let pointer = i;

    let idx = u32(data, pointer);
    pointer += idx.bytes;

    return {
        value: {
            i: idx.value,
            type: INDEXTYPE.localidx.value.type
        }, 
        bytes: pointer - i
    };
}

function globalidx(data, i){
    let pointer = i;

    let idx = u32(data, pointer);
    pointer += idx.bytes;

    return {
        value: {
            i: idx.value,
            type: INDEXTYPE.globalidx.value.type
        }, 
        bytes: pointer - i
    };
}

module.exports = { typeidx, funcidx, tableidx, memidx, globalidx, localidx, labelidx }