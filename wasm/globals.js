
/**** GLOBALS */
const { toHex } = require("../helper");
const { leb2int, leb2uint } = require("./leb128");

const ibyte = (data, i) => new Object({ value: data.readInt8(i), bytes: 1 });
const ubyte = (data, i) => new Object({ value: data.readUInt8(i), bytes: 1 });
const sN = (data, i, N) => leb2int(data, i, Math.ceil(N / 7));
const uN = (data, i, N) => leb2uint(data, i, Math.ceil(N / 7));
const i32 = (data, i) => sN(data, i, 32);
const u32 = (data, i) => uN(data, i, 32);
const i64 = (data, i) => sN(data, i, 64);
const u64 = (data, i) => uN(data, i, 64);

const f32 = (data, i) => new Object({ value: data.readFloatLE(i), bytes: 4 });
const f64 = (data, i) => new Object({ value: data.readDoubleLE(i), bytes: 8 });

function vec(data, i, B){
    let pointer = i;

    const length = u32(data, pointer);
    pointer += length.bytes;
    
    const values = new Array(length.value).fill(0).map(_ => {
        const x = B(data, pointer);
        pointer += x.bytes;
        return x.value;
    });

    return {
        value: values, 
        bytes: pointer - i
    };
}

const LIMITSTYPE = {
    min  : {value: { hex: 0x0, type: "min"   } },
    clamp: {value: { hex: 0x1, type: "clamp" } }
};

function limits(data, i){
    let pointer = i;

    let limits_type = ubyte(data, pointer);
    pointer += limits_type.bytes;

    let limits_result = null;
    switch(limits_type.value){
        case LIMITSTYPE.min.value.hex:
            const n_min = u32(data, pointer);
            pointer += n_min.bytes;
            
            limits_result = Object.assign({ min: n_min.value }, LIMITSTYPE.min.value);
        break;
        case LIMITSTYPE.clamp.value.hex:
            const n_clamp = u32(data, pointer);
            pointer += n_clamp.bytes;
            
            const m_clamp = u32(data, pointer);
            pointer += m_clamp.bytes;
            
            limits_result = Object.assign({ min: n_clamp.value, max: m_clamp.value }, LIMITSTYPE.clamp.value);
        break;
        default: throw `VALTYPE ${toHex(magic.value)} Not found, expected ${Object.entries(VALTYPE).map(e => `${e[0]} (${toHex(e[1].value.hex)})`).join(" or ")}`;
    }

    return {
        value: limits_result,
        bytes: pointer - i
    };
}

function name(data, i){
    let pointer = i;

    const byte_string = vec(data, pointer, ubyte);
    pointer += byte_string.bytes;

    return {
        value: byte_string.value.map(b => String.fromCharCode(b)).join(''),
        bytes: pointer - i
    };
}


// Infinite union of all function types
function funcref(data, i){

}

function memarg(data, i){
    let pointer = i;

    let a = ubyte(data, pointer);
    pointer += a.bytes;

    let o = ubyte(data, pointer);
    pointer += o.bytes;
    
    return {
        value: { align: a.value, offset: o.value },
        bytes: pointer - i
    };
}

const MUTTYPE = {
    const: { value: { hex: 0x0, type: "const" } },
    var:   { value: { hex: 0x1, type: "var"   } }
};

// mutability
function mut(data, i){
    let pointer = i;

    const magic = ubyte(data, pointer);
    pointer += magic.bytes;

    let mut_result = null;
    switch(magic.value){
        case MUTTYPE.const.value.hex: mut_result = Object.assign({}, MUTTYPE.const.value); break;
        case MUTTYPE.var.value.hex  : mut_result = Object.assign({}, MUTTYPE.var.value);   break;
        default: throw `MUTTYPE ${toHex(magic.value)} Not found, expected ${Object.entries(MUTTYPE).map(e => `${e[0]} (${toHex(e[1].value.hex)})`).join(" or ")}`;
    }

    return  {
        value: mut_result,
        bytes: pointer - i
    };
}

function expr(data, i, stop_opcodes = [MAGIC_END]){
    let pointer = i;

    let instructions = new Array();
    do{
        let expr_instr = instr(data, pointer);
        instructions.push(expr_instr.value);
        pointer += expr_instr.bytes;
    }while(stop_opcodes.findIndex(op => ubyte(data, pointer).value === op) < 0);

    return {
        value: instructions,
        bytes: pointer - i + 1 // Jump opcode
    };
}

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

module.exports = { 
    u32, u64, i32, i64, f32, f64, 
    ibyte, ubyte,
    mut, 
    vec, limits,
    name, locals, expr,
    memarg,
    funcref
};