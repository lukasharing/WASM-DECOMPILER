const { memidx } = require("./indices");
const { vec, expr, ubyte } = require("./globals");

function data_wasm(data, i){
    let pointer = i;

    const x = memidx(data, pointer);
	pointer += x.bytes;

    const e = expr(data, pointer);
	pointer += e.bytes;

    const b = vec(data, pointer, ubyte);
	pointer += b.bytes;

    return {
        value: { data: x.value, offset: e.value, init: b.value },
        bytes: pointer - i
    };
}

function datasec(data, i){
    let pointer = i;

    let section = vec(data, pointer, data_wasm);
    pointer += section.bytes;

    return {
        value: section.value,
        bytes: pointer - i
    };
}

module.exports = { datasec };