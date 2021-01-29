const { toHex } = require("../helper");
const { vec, limits, mut, ubyte } = require("./globals");

const VALTYPE = {
    i32: { value: { hex: 0x7F, type: "i32" } },
    i64: { value: { hex: 0x7E, type: "i64" } },
    f32: { value: { hex: 0x7D, type: "f32" } },
    f64: { value: { hex: 0x7C, type: "f64" } }
};

function valtype(data, i){
    let pointer = i;

    const magic = ubyte(data, pointer);
    pointer += magic.bytes;

    let valtype_result = null;
    switch(magic.value){
        case VALTYPE.i32.value.hex: valtype_result = Object.assign({}, VALTYPE.i32.value); break;
        case VALTYPE.i64.value.hex: valtype_result = Object.assign({}, VALTYPE.i64.value); break;
        case VALTYPE.f32.value.hex: valtype_result = Object.assign({}, VALTYPE.f32.value); break;
        case VALTYPE.f64.value.hex: valtype_result = Object.assign({}, VALTYPE.f64.value); break;
        default: throw `VALTYPE ${toHex(magic.value)} Not found, expected ${Object.entries(VALTYPE).map(e => `${e[0]} (${toHex(e[1].value.hex)})`).join(" or ")}`;
	}
	
    return {
        value: valtype_result,
        bytes: pointer - i
    };
}

function resulttype(data, i){
	let pointer = i;

	let types = vec(data, pointer, valtype);
    pointer += types.bytes;
	
	return {
        value: { types: types.value, type: "resulttype" },
        bytes: pointer - i
    };
}

const FUNCTYPE_MAGIC = 0x60;
function functype(data, i){
    let pointer = i;

    const magic = ubyte(data, pointer);
    if(magic.value !== FUNCTYPE_MAGIC){
        throw `Functype Magic Number ${toHex(magic.value)} expected ${toHex(FUNCTYPE_MAGIC)}`;
    }
    pointer += magic.bytes;

    const rt1 = resulttype(data, pointer);
    pointer += rt1.bytes;
    
    const rt2 = resulttype(data, pointer);
    pointer += rt2.bytes;

    return {
        value: { arguments: rt1.value, result: rt2.value, type: "functype" },
        bytes: pointer - i
    };
}

// Infinite union of all function types
function funcref(data, i){

}

const MAGIC_ELEMTYPE = 0x70;
function elemtype(data, i){
    let pointer = i;

    const magic = ubyte(data, pointer);
    if(magic.value !== MAGIC_ELEMTYPE){
        throw `Elemtype Magic Number ${toHex(magic.value)} expected ${toHex(MAGIC_ELEMTYPE)}`;
    }
    pointer += magic.bytes;

    // TODO: WHAT IS FUNCREF
    return {
        value: { ref: funcref, type: "elemtype" },
        bytes: pointer - i
    };
}

function memtype(data, i){
	let pointer = i;
	
	const lim = limits(data, pointer);
	pointer += lim.bytes;

    return {
        value: { limits: lim.value, type: "memtype" },
        bytes: pointer - i
    };
}

function tabletype(data, i){
    let pointer = i;

    const et = elemtype(data, pointer);
    pointer += et.bytes;

    const lim = limits(data, pointer);
    pointer += lim.bytes;

    return {
        value: { limits: lim.value, elementype: et.value, type: "tabletype" },
        bytes: pointer - i
    };
}

function globaltype(data, i){
    let pointer = i;

    const t = valtype(data, pointer);
    pointer += t.bytes;

    const m = mut(data, pointer);
    pointer += m.bytes;

    return {
        value: { valtype: t.value, mutability: m.value, type: "globaltype" },
        bytes: pointer - i
    };
}

module.exports = { valtype, resulttype, functype, elemtype, memtype, tabletype, globaltype };