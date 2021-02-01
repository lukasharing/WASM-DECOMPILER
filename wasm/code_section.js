const { vec, u32 } = require("./globals");
const { valtype } = require("./types");
const { expr } = require("./instructions");

function locals(data, i){
    let pointer = i;
	
	const n = u32(data, pointer);
	pointer += n.bytes;

	const t = valtype(data, pointer);
	pointer += t.bytes;

	return {
        value: new Array(n.value).fill(t.value) ,
        bytes: pointer - i
    };
}

var j_temp = 0;
function func(data, i){
    let pointer = i;
    
    let t = vec(data, pointer, locals);
    if(t.bytes >= Math.pow(2, 32)){
		throw `Maximum Byte Size Exceed`;
	}
    pointer += t.bytes;
    
    let e = expr(data, pointer, undefined, j_temp === 774);
    pointer += e.bytes;

	return {
        value: { locals: t.value.flat(), body: e.value },
        bytes: pointer - i
    };
}

function code(data, i){
    let pointer = i;

    ++j_temp;

    const size = u32(data, pointer);
	pointer += size.bytes;

    try{ // X
        const code = func(data, pointer);
        if(size.value !== code.bytes){
            throw `Code byte size does not match with code length.`;
        }
        pointer += code.bytes;

        return {
            value: { code: code.value },
            bytes: pointer - i
        };
    }catch(e){
        throw (pointer + size.value - i).toString();
    }
}

function codesec(data, i){
    let pointer = i;

    let section = vec(data, pointer, code);
    pointer += section.bytes;

    return {
        value: section.value,
        bytes: pointer - i
    };
}

module.exports = { codesec };