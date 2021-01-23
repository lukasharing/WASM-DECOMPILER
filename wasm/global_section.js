const { vec, expr } = require("./globals");
const { globaltype } = require("./types");

function global(data, i){
    let pointer = i;
    
    const gt = globaltype(data, pointer);
    pointer += gt.bytes;

    const e = expr(data, pointer);
    pointer += e.bytes;

    return {
        value: { type: gt.value, init: e.value },
        bytes: pointer - i
    };
}

function globalsec(data, i){
    let pointer = i;
    
    let section = vec(data, pointer, global);
    pointer += section.bytes;

    return {
        value: section.value,
        bytes: pointer - i
    };
}

module.exports = { globalsec };