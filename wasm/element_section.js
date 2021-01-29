const { tableidx, funcidx } = require("./indices");
const { vec } = require("./globals");
const { expr } = require("./instructions");

function elem(data, i){
    let pointer = i;
    let x = tableidx(data, pointer);
    pointer += x.bytes;

    let e = expr(data, pointer);
    pointer += e.bytes;

    let y = vec(data, pointer, funcidx);
    pointer += y.bytes;

    return {
        value: { index: x.value, offset: e.value, init: y.value },
        bytes: pointer - i
    };
}

function elemsec(data, i){
    let pointer = i;
    
    let section = vec(data, pointer, elem);
    pointer += section.bytes;

    return {
        value: section.value,
        bytes: pointer - i
    };
}

module.exports = { elemsec };