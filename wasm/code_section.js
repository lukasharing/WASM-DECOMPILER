const { vec, expr, locals } = require("./globals");

function func(data, i){
    let pointer = i;
    
    let t = vec(data, pointer, locals);
    if(t.bytes >= Math.pow(2, 32)){
		throw `Maximum Byte Size Exceed`;
	}
    pointer += t.bytes;
    
    let e = expr(data, pointer);
    pointer += e.bytes;

	return {
        value: { locals: t.value.flat(), body: e.value },
        bytes: pointer - i
    };
}

function code(data, i){
    let pointer = i;

    const size = u32(data, pointer);
	pointer += size.bytes;

    const code = func(data, pointer);
	if(size.value !== code.bytes){
        throw `Code byte size does not match with code length.`;
	}
	pointer += code.bytes;

    return {
        value: { code: code.value },
        bytes: pointer - i
    };
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