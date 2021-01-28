const { i32, i64, f32, f64, sN, ubyte, memarg } = require("./globals");
const { valtype } = require("./types");
const { globalidx, localidx, labelidx, funcidx, typeidx } = require("./indices");

// TODO: Check : n_result
const INSTRYPE = {
    unreachable  : { value: { hex: 0x00, name: "unreachable"                      } },
    nop          : { value: { hex: 0x01, name: "nop"                              } },
    block        : { value: { hex: 0x02, name: "block"                            } },
    loop         : { value: { hex: 0x03, name: "loop"                             } },
    if           : { value: { hex: 0x04, name: "if"                               } },
    br           : { value: { hex: 0x0C, name: "br"                               } },
    br_if        : { value: { hex: 0x0D, name: "br_if", n_consume: 1, n_result: 1 } },
    br_table     : { value: { hex: 0x0E, name: "br_table"                         } },
    return       : { value: { hex: 0x0F, name: "return"                           } },
    call         : { value: { hex: 0x10, name: "call"                             } },
    call_indirect: { value: { hex: 0x11, name: "call_indirect"                    } },
    
	drop  : { value: { hex: 0x1A, name: "drop", n_consume: 1, n_result: 1   } },
    select: { value: { hex: 0x1B, name: "select" } },
    
	local_get: { value: { hex: 0x20, name: "local.get" } },
	local_set: { value: { hex: 0x21, name: "local.set", n_consume: 1, n_result: 1 } },
    local_tee: { value: { hex: 0x22, name: "local.tee", n_consume: 1, n_result: 1  } },
    
	global_get: { value: { hex: 0x23, name: "global.get" } },
	global_set: { value: { hex: 0x24, name: "global.set" } },

    i32_load   : { value: { hex: 0x28, name: "i32.load", n_consume: 1, n_result: 1 } },
    i64_load   : { value: { hex: 0x29, name: "i64.load", n_consume: 1, n_result: 1 } },
    
    f32_load   : { value: { hex: 0x2A, name: "f32.load", n_consume: 1, n_result: 1 } },
    f64_load   : { value: { hex: 0x2B, name: "f64.load", n_consume: 1, n_result: 1 } },

    i32_load8_s: { value: { hex: 0x2C, name: "i32.load8_s", n_consume: 1, n_result: 1 } },
    i32_load8_u: { value: { hex: 0x2D, name: "i32.load8_u", n_consume: 1, n_result: 1 } },
    i32_load16_s: { value: { hex: 0x2E, name: "i32.load16_s", n_consume: 1, n_result: 1 } },
    i32_load16_u: { value: { hex: 0x2F, name: "i32.load16_u", n_consume: 1, n_result: 1 } },
    
    i64_load8_s: { value: { hex: 0x30, name: "i64.load8_s", n_consume: 1, n_result: 1 } },
    i64_load8_u: { value: { hex: 0x31, name: "i64.load8_u", n_consume: 1, n_result: 1 } },
    i64_load16_s: { value: { hex: 0x32, name: "i64.load16_s", n_consume: 1, n_result: 1 } },
    i64_load16_u: { value: { hex: 0x33, name: "i64.load16_u", n_consume: 1, n_result: 1 } },
    i64_load32_s: { value: { hex: 0x34, name: "i64.load32_s", n_consume: 1, n_result: 1 } },
    i64_load32_u: { value: { hex: 0x35, name: "i64.load32_u", n_consume: 1, n_result: 1 } },

    i32_store  : { value: { hex: 0x36, name: "i32.store", n_consume: 2, n_result: 1 } },
    i64_store  : { value: { hex: 0x37, name: "i64.store", n_consume: 2, n_result: 1 } },
    
    f32_store  : { value: { hex: 0x38, name: "f32.store", n_consume: 2, n_result: 1 } },
    f64_store  : { value: { hex: 0x39, name: "f64.store", n_consume: 2, n_result: 1 } },

    i32_store8 : { value: { hex: 0x3A, name: "i32.store8", n_consume: 2, n_result: 1 } },
    i32_store16: { value: { hex: 0x3B, name: "i32.store16", n_consume: 2, n_result: 1 } },
    i32_store32: { value: { hex: 0x3C, name: "i32.store32", n_consume: 2, n_result: 1 } },

    memory_size: { value: { hex: 0x3F, name: "memory.size" } }, 
    memory_grow: { value: { hex: 0x40, name: "memory.grow" } }, 

    i32_const: { value: { hex: 0x41, name: "i32.const" } },
    i64_const: { value: { hex: 0x42, name: "i64.const" } },
    f32_const: { value: { hex: 0x43, name: "f32.const" } },
    f64_const: { value: { hex: 0x44, name: "f64.const" } },

    i32_eqz : { value: { hex: 0x45, name: "i32.eqz", n_consume: 1, n_result: 1  } },
    i32_eq  : { value: { hex: 0x46, name: "i32.eq", n_consume: 2, n_result: 1   } },
    i32_ne  : { value: { hex: 0x47, name: "i32.ne", n_consume: 2, n_result: 1   } },
    i32_lt_s: { value: { hex: 0x48, name: "i32.lt_s", n_consume: 2, n_result: 1 } },
    i32_lt_u: { value: { hex: 0x49, name: "i32.lt_u", n_consume: 2, n_result: 1 } },
    i32_gt_s: { value: { hex: 0x4A, name: "i32.gt_s", n_consume: 2, n_result: 1 } },
    i32_gt_u: { value: { hex: 0x4B, name: "i32.gt_u", n_consume: 2, n_result: 1 } },
    i32_le_s: { value: { hex: 0x4C, name: "i32.le_s", n_consume: 2, n_result: 1 } },
    i32_le_u: { value: { hex: 0x4D, name: "i32.le_u", n_consume: 2, n_result: 1 } },
    i32_ge_s: { value: { hex: 0x4E, name: "i32.ge_s", n_consume: 2, n_result: 1 } },
    i32_ge_u: { value: { hex: 0x4F, name: "i32.ge_u", n_consume: 2, n_result: 1 } },

    i64_eqz : { value: { hex: 0x50, name: "i64.eqz", n_consume: 1, n_result: 1  } },
    i64_eq  : { value: { hex: 0x51, name: "i64.eq", n_consume: 2, n_result: 1   } },
    i64_ne  : { value: { hex: 0x52, name: "i64.ne", n_consume: 2, n_result: 1   } },
    i64_lt_s: { value: { hex: 0x53, name: "i64.lt_s", n_consume: 2, n_result: 1 } },
    i64_lt_u: { value: { hex: 0x54, name: "i64.lt_u", n_consume: 2, n_result: 1 } },
    i64_gt_s: { value: { hex: 0x55, name: "i64.gt_s", n_consume: 2, n_result: 1 } },
    i64_gt_u: { value: { hex: 0x56, name: "i64.gt_u", n_consume: 2, n_result: 1 } },
    i64_le_s: { value: { hex: 0x57, name: "i64.le_s", n_consume: 2, n_result: 1 } },
    i64_le_u: { value: { hex: 0x58, name: "i64.le_u", n_consume: 2, n_result: 1 } },
    i64_ge_s: { value: { hex: 0x59, name: "i64.ge_s", n_consume: 2, n_result: 1 } },
    i64_ge_u: { value: { hex: 0x5A, name: "i64.ge_u", n_consume: 2, n_result: 1 } },

    f32_eq: { value: { hex: 0x5B, name: "f32.eq", n_consume: 2, n_result: 1 } },
    f32_ne: { value: { hex: 0x5C, name: "f32.ne", n_consume: 2, n_result: 1 } },
    f32_lt: { value: { hex: 0x5D, name: "f32.lt", n_consume: 2, n_result: 1 } },
    f32_gt: { value: { hex: 0x5E, name: "f32.gt", n_consume: 2, n_result: 1 } },
    f32_le: { value: { hex: 0x5F, name: "f32.le", n_consume: 2, n_result: 1 } },
    f32_ge: { value: { hex: 0x60, name: "f32.ge", n_consume: 2, n_result: 1 } },
    
    f64_eq: { value: { hex: 0x61, name: "f64.eq", n_consume: 2, n_result: 1 } },
    f64_ne: { value: { hex: 0x62, name: "f64.ne", n_consume: 2, n_result: 1 } },
    f64_lt: { value: { hex: 0x63, name: "f64.lt", n_consume: 2, n_result: 1 } },
    f64_gt: { value: { hex: 0x64, name: "f64.gt", n_consume: 2, n_result: 1 } },
    f64_le: { value: { hex: 0x65, name: "f64.le", n_consume: 2, n_result: 1 } },
    f64_ge: { value: { hex: 0x66, name: "f64.ge", n_consume: 2, n_result: 1 } },

    i32_add  : { value: { hex: 0x6A, name: "i32.add", n_consume: 2, n_result: 1     } },
    i32_sub  : { value: { hex: 0x6B, name: "i32.sub", n_consume: 2, n_result: 1     } },
    i32_mul  : { value: { hex: 0x6C, name: "i32.mul", n_consume: 2, n_result: 1     } },
    i32_div_s: { value: { hex: 0x6D, name: "i32.div_s", n_consume: 2, n_result: 1   } },
    i32_div_u: { value: { hex: 0x6E, name: "i32.div_u", n_consume: 2, n_result: 1   } },
    i32_rem_s : { value: { hex: 0x6F, name: "i32.rem_s", n_consume: 2, n_result: 1  } },
    i32_rem_u : { value: { hex: 0x70, name: "i32.rem_u", n_consume: 2, n_result: 1  } },
    i32_and  : { value: { hex: 0x71, name: "i32.and", n_consume: 2, n_result: 1     } },    
    i32_or   : { value: { hex: 0x72, name: "i32.or", n_consume: 2, n_result: 1      } },    
    i32_xor  : { value: { hex: 0x73, name: "i32.xor", n_consume: 2, n_result: 1     } },
    i32_shl  : { value: { hex: 0x74, name: "i32.shl", n_consume: 2, n_result: 1     } },
    i32_shr_s: { value: { hex: 0x75, name: "i32.shr_s", n_consume: 2, n_result: 1   } },
    i32_shr_u: { value: { hex: 0x76, name: "i32.shr_u", n_consume: 2, n_result: 1   } },
    
    i64_clz   : { value: { hex: 0x79, name: "i64.clz", n_consume: 1, n_result: 1    } },
    i64_ctz   : { value: { hex: 0x7A, name: "i64.ctz", n_consume: 1, n_result: 1    } },
    i64_popcnt: { value: { hex: 0x7B, name: "i64.popcnt", n_consume: 1, n_result: 1 } },
    i64_add   : { value: { hex: 0x7C, name: "i64.add", n_consume: 2, n_result: 1    } },
    i64_sub   : { value: { hex: 0x7D, name: "i64.sub", n_consume: 2, n_result: 1    } },
    i64_mul   : { value: { hex: 0x7E, name: "i64.mul", n_consume: 2, n_result: 1    } },
    i64_div_s : { value: { hex: 0x7F, name: "i64.div_s", n_consume: 2, n_result: 1  } },
    i64_div_u : { value: { hex: 0x80, name: "i64.div_u", n_consume: 2, n_result: 1  } },
    i64_rem_s : { value: { hex: 0x81, name: "i64.rem_s", n_consume: 2, n_result: 1  } },
    i64_rem_u : { value: { hex: 0x82, name: "i64.rem_u", n_consume: 2, n_result: 1  } },
    i64_and   : { value: { hex: 0x83, name: "i64.and", n_consume: 2, n_result: 1    } },
    i64_or    : { value: { hex: 0x84, name: "i64.or", n_consume: 2, n_result: 1     } },
    i64_xor   : { value: { hex: 0x85, name: "i64.xor", n_consume: 2, n_result: 1    } },
    i64_shl   : { value: { hex: 0x86, name: "i64.shl", n_consume: 2, n_result: 1    } },
    i64_shr_s : { value: { hex: 0x87, name: "i64.shr_s", n_consume: 2, n_result: 1  } },
    i64_shr_u : { value: { hex: 0x88, name: "i64.shr_u", n_consume: 2, n_result: 1  } },
    
    f32_abs     : { value: { hex: 0x8B, name: "f32.abs", n_consume: 1, n_result: 1      } },
    f32_neg     : { value: { hex: 0x8C, name: "f32.neg", n_consume: 1, n_result: 1      } },
    f32_ceil    : { value: { hex: 0x8D, name: "f32.ceil", n_consume: 1, n_result: 1     } },
    f32_floor   : { value: { hex: 0x8E, name: "f32.floor", n_consume: 1, n_result: 1    } },
    f32_trunc   : { value: { hex: 0x8F, name: "f32.trunc", n_consume: 1, n_result: 1    } },
    f32_nearest : { value: { hex: 0x90, name: "f32.nearest", n_consume: 1, n_result: 1  } },
    f32_sqrt    : { value: { hex: 0x91, name: "f32.sqrt", n_consume: 1, n_result: 1     } },
    f32_add     : { value: { hex: 0x92, name: "f32.add", n_consume: 2, n_result: 1      } },
    f32_sub     : { value: { hex: 0x93, name: "f32.sub", n_consume: 2, n_result: 1      } },
    f32_mul     : { value: { hex: 0x94, name: "f32.mul", n_consume: 2, n_result: 1      } },
    f32_div     : { value: { hex: 0x95, name: "f32.div", n_consume: 2, n_result: 1      } },
    f32_min     : { value: { hex: 0x96, name: "f32.min", n_consume: 2, n_result: 1      } },
    f32_max     : { value: { hex: 0x97, name: "f32.max", n_consume: 2, n_result: 1      } },
    f32_copysign: { value: { hex: 0x98, name: "f32.copysign", n_consume: 2, n_result: 1 } },

    f64_abs     : { value: { hex: 0x99, name: "f64.abs", n_consume: 1, n_result: 1      } },
    f64_neg     : { value: { hex: 0x9A, name: "f64.neg", n_consume: 1, n_result: 1      } },
    f64_ceil    : { value: { hex: 0x9B, name: "f64.ceil", n_consume: 1, n_result: 1     } },
    f64_floor   : { value: { hex: 0x9C, name: "f64.floor", n_consume: 1, n_result: 1    } },
    f64_trunc   : { value: { hex: 0x9D, name: "f64.trunc", n_consume: 1, n_result: 1    } },
    f64_nearest : { value: { hex: 0x9E, name: "f64.nearest", n_consume: 1, n_result: 1  } },
    f64_sqrt    : { value: { hex: 0x9F, name: "f64.sqrt", n_consume: 1, n_result: 1     } },
    f64_add     : { value: { hex: 0xA0, name: "f64.add", n_consume: 2, n_result: 1      } },
    f64_sub     : { value: { hex: 0xA1, name: "f64.sub", n_consume: 2, n_result: 1      } },
    f64_mul     : { value: { hex: 0xA2, name: "f64.mul", n_consume: 2, n_result: 1      } },
    f64_div     : { value: { hex: 0xA3, name: "f64.div", n_consume: 2, n_result: 1      } },
    f64_min     : { value: { hex: 0xA4, name: "f64.min", n_consume: 2, n_result: 1      } },
    f64_max     : { value: { hex: 0xA5, name: "f64.max", n_consume: 2, n_result: 1      } },
    f64_copysign: { value: { hex: 0xA6, name: "f64.copysign", n_consume: 2, n_result: 1 } },

    i32_wrap_i64: { value: { hex: 0xA7, name: "i32.wrap_i64", n_consume: 1, n_result: 1 } }, 
    
    i32_trunc_f32_s: { value: { hex: 0xA8, name: "i32.trunc_f32_s", n_consume: 1, n_result: 1 } }, 
    i32_trunc_f32_u: { value: { hex: 0xA9, name: "i32.trunc_f32_u", n_consume: 1, n_result: 1 } }, 
    i32_trunc_f64_s: { value: { hex: 0xAA, name: "i32.trunc_f64_s", n_consume: 1, n_result: 1 } }, 
    i32_trunc_f64_u: { value: { hex: 0xAB, name: "i32.trunc_f64_u", n_consume: 1, n_result: 1 } }, 

    i64_extend_i32_s: { value: { hex: 0xAC, name: "i64.extend_i32_s", n_consume: 1, n_result: 1 } }, 
    i64_extend_i32_u: { value: { hex: 0xAD, name: "i64.extend_i32_u", n_consume: 1, n_result: 1 } },
    
    i64_trunc_f32_s: { value: { hex: 0xAE, name: "i64.trunc_f32_s", n_consume: 1, n_result: 1 } }, 
    i64_trunc_f32_u: { value: { hex: 0xAF, name: "i64.trunc_f32_u", n_consume: 1, n_result: 1 } }, 
    i64_trunc_f64_s: { value: { hex: 0xB0, name: "i64.trunc_f64_s", n_consume: 1, n_result: 1 } }, 
    i64_trunc_f64_u: { value: { hex: 0xB1, name: "i64.trunc_f64_u", n_consume: 1, n_result: 1 } }, 

    f32_convert_i32_s: { value: { hex: 0xB2, name: "f32.convert_i32_s", n_consume: 1, n_result: 1 } }, 
    f32_convert_i32_u: { value: { hex: 0xB3, name: "f32.convert_i32_u", n_consume: 1, n_result: 1 } },
    
    f32_demote_f64: { value: { hex: 0xB6, name: "f32.demote_f64", n_consume: 1, n_result: 1 } },

    i64_convert_i32_s: { value: { hex: 0xB7, name: "i64.convert_i32_s", n_consume: 1, n_result: 1 } }, 
    i64_convert_i32_u: { value: { hex: 0xB8, name: "i64.convert_i32_u", n_consume: 1, n_result: 1 } }, 
    i64_convert_i64_s: { value: { hex: 0xB9, name: "i64.convert_i64_s", n_consume: 1, n_result: 1 } }, 
    i64_convert_i64_u: { value: { hex: 0xBA, name: "i64.convert_i64_u", n_consume: 1, n_result: 1 } }, 
    
    f64_promote_f32: { value: { hex: 0xBB, name: "f64.promote_f32", n_consume: 1, n_result: 1 } },

    i32_reinterpret_f32: { value: { hex: 0xBC, name: "i32.reinterpret_f32", n_consume: 1, n_result: 1 } }, 
    i64_reinterpret_f64: { value: { hex: 0xBD, name: "i64.reinterpret_f64", n_consume: 1, n_result: 1 } },
    f32_reinterpret_i32: { value: { hex: 0xBE, name: "f32.reinterpret_i32", n_consume: 1, n_result: 1 } }, 
    f64_reinterpret_i64: { value: { hex: 0xBF, name: "f64.reinterpret_i64", n_consume: 1, n_result: 1 } },
    
};

const MAGIC_BLOCKTYPE = 0x40;
function blocktype(data, i){
    let pointer = i;
    
    let type = ubyte(data, pointer);
    if(type.value === MAGIC_BLOCKTYPE){
        pointer += type.bytes;
    }else{
        try{
            type = valtype(data, i);
            pointer += type.bytes;
        }catch(e){
            type = sN(data, i, 33);
            pointer += type.bytes;
        }
    }

    return {
        value: { type: type.value },
        bytes: pointer - i
    };
};

const MAGIC_END = 0x0B;
const MAGIC_IF = 0x05;
const MAGIC_MEMORY = 0x00;
const MAGIC_CALL_INDIRECT = 0x00;

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

function instr(data, i){
    let pointer = i;

    const magic = ubyte(data, pointer);
    pointer += magic.bytes;

    let instr_result = null;
    switch(magic.value){
        case INSTRYPE.unreachable.value.hex:
            instr_result = Object.assign({}, INSTRYPE.unreachable.value);
        break;
        
        case INSTRYPE.nop.value.hex:
            instr_result = Object.assign({}, INSTRYPE.nop.value);
        break;

        case INSTRYPE.block.value.hex:
            
            const bt_block = blocktype(data, pointer);
            pointer += bt_block.bytes;
            
            const instr_block = expr(data, pointer);
            pointer += instr_block.bytes;

            instr_result = Object.assign({ bt: bt_block.value, instr: instr_block.value}, INSTRYPE.block.value);
        break;

        case INSTRYPE.loop.value.hex:
            
            const bt_loop = blocktype(data, pointer);
            pointer += bt_loop.bytes;
        
            const instr_loop = expr(data, pointer);
            pointer += instr_loop.bytes;

            instr_result = Object.assign({ bt: bt_loop.value, instr: instr_loop.value}, INSTRYPE.loop.value);

        break;

        case INSTRYPE.if.value.hex:
            
            const bt_if = blocktype(data, pointer);
            pointer += bt_if.bytes;
        
            let instr1_if = expr(data, pointer, [MAGIC_END, MAGIC_IF]);
            let instr2_if = { value: null };
            pointer += instr1_if.bytes;
            
            const magic_if = ubyte(data, pointer - 1);
            if(magic_if.value === MAGIC_IF){
                instr2_if = expr(data, pointer);
                pointer += instr2_if.bytes;                
            }

            instr_result = Object.assign({ bt: bt_if.value, block_if: instr1_if.value, block_else: instr2_if.value}, INSTRYPE.if.value);

        break;
        
        case INSTRYPE.br.value.hex:

            const l_br = labelidx(data, pointer);
            pointer += l_br.bytes;
            
            instr_result = Object.assign({ label: l_br.value}, INSTRYPE.br.value);

        break;

        case INSTRYPE.br_if.value.hex:
            
            const l_br_if = labelidx(data, pointer);
            pointer += l_br_if.bytes;
            
            instr_result = Object.assign({ label: l_br_if.value}, INSTRYPE.br_if.value);

        break;

        case INSTRYPE.br_table.value.hex:
            
            const l_br_table = vec(data, pointer, labelidx);
            pointer += l_br_table.bytes;

            const lN_br_table = labelidx(data, pointer);
            pointer += lN_br_table.bytes;
            
            instr_result = Object.assign({ label: lN_br_table.value, lN: lN_br_table.value}, INSTRYPE.br_table.value);

        break;
        
        case INSTRYPE.return.value.hex: instr_result = Object.assign({}, INSTRYPE.return.value); break;

        case INSTRYPE.call.value.hex:

            const x_call = funcidx(data, pointer);
            pointer += x_call.bytes;

            instr_result = Object.assign({ index: x_call.value }, INSTRYPE.call.value);

        break;

        case INSTRYPE.call_indirect.value.hex:
            
            const x_call_indirect = typeidx(data, pointer);
            pointer += x_call_indirect.bytes;

            const magic_call_indirect = ubyte(data, pointer);
            if(magic_call_indirect.value !== MAGIC_CALL_INDIRECT){
                throw `endinstr in call indirect, Magic Number got ${toHex(magic_call_indirect.value)}, but expected ${toHex(MAGIC_CALL_INDIRECT)}`;
            }
            pointer += magic_call_indirect.bytes;

            instr_result = Object.assign({ index: x_call_indirect.value }, INSTRYPE.call_indirect.value);

        break;
        
        case INSTRYPE.drop.value.hex  : instr_result = Object.assign({}, INSTRYPE.drop.value);   break;
        case INSTRYPE.select.value.hex: instr_result = Object.assign({}, INSTRYPE.select.value); break;

        case INSTRYPE.local_get.value.hex:

			const local_get = localidx(data, pointer);
			pointer += local_get.bytes;

            instr_result = Object.assign({ index: local_get.value }, INSTRYPE.local_get.value);
            
        break;
        
        case INSTRYPE.local_set.value.hex:

			const local_set = localidx(data, pointer);
			pointer += local_set.bytes;

            instr_result = Object.assign({ index: local_set.value }, INSTRYPE.local_set.value);
            
        break;
        
        case INSTRYPE.local_tee.value.hex:

			const local_tee = localidx(data, pointer);
			pointer += local_tee.bytes;

			instr_result = Object.assign({ index: local_tee.value }, INSTRYPE.local_tee.value);
						
		break;

        case INSTRYPE.global_get.value.hex:

			const global_get = globalidx(data, pointer);
			pointer += global_get.bytes;

			instr_result = Object.assign({ index: global_get.value }, INSTRYPE.global_get.value);
						
        break;
        
        case INSTRYPE.global_set.value.hex:

			const global_set = globalidx(data, pointer);
			pointer += global_set.bytes;

			instr_result = Object.assign({ index: global_set.value }, INSTRYPE.global_set.value);
						
		break;

        case INSTRYPE.i32_load.value.hex:

			const i32_load = memarg(data, pointer);
			pointer += i32_load.bytes;

			instr_result = Object.assign({ m: i32_load.value }, INSTRYPE.i32_load.value);
						
        break;
        
        case INSTRYPE.i64_load.value.hex:

			const i64_load = memarg(data, pointer);
			pointer += i64_load.bytes;

			instr_result = Object.assign({ m: i64_load.value }, INSTRYPE.i64_load.value);
						
        break;
        
        case INSTRYPE.f32_load.value.hex:

			const f32_load = memarg(data, pointer);
			pointer += f32_load.bytes;

			instr_result = Object.assign({ m: f32_load.value }, INSTRYPE.f32_load.value);
						
        break;
        
        case INSTRYPE.f64_load.value.hex:

			const f64_load = memarg(data, pointer);
			pointer += f64_load.bytes;

			instr_result = Object.assign({ m: f64_load.value }, INSTRYPE.f64_load.value);
						
        break;
        
        case INSTRYPE.i32_load8_s.value.hex:

			const i32_load8_s = memarg(data, pointer);
			pointer += i32_load8_s.bytes;

			instr_result = Object.assign({ m: i32_load8_s.value }, INSTRYPE.i32_load8_s.value);
						
        break;

        case INSTRYPE.i32_load8_u.value.hex:

			const i32_load8_u = memarg(data, pointer);
			pointer += i32_load8_u.bytes;

			instr_result = Object.assign({ m: i32_load8_u.value }, INSTRYPE.i32_load8_u.value);
						
		break;

        case INSTRYPE.i32_store.value.hex:

			const i32_store = memarg(data, pointer);
			pointer += i32_store.bytes;

			instr_result = Object.assign({ m: i32_store.value }, INSTRYPE.i32_store.value);
						
        break;
        
        case INSTRYPE.i64_store.value.hex:

			const i64_store = memarg(data, pointer);
			pointer += i64_store.bytes;

			instr_result = Object.assign({ m: i64_store.value }, INSTRYPE.i64_store.value);
						
        break;

        case INSTRYPE.f32_store.value.hex:

			const f32_store = memarg(data, pointer);
			pointer += f32_store.bytes;

			instr_result = Object.assign({ m: f32_store.value }, INSTRYPE.f32_store.value);
						
        break;
        
        case INSTRYPE.f64_store.value.hex:

			const f64_store = memarg(data, pointer);
			pointer += f64_store.bytes;

			instr_result = Object.assign({ m: f64_store.value }, INSTRYPE.f64_store.value);
						
        break;

        
        case INSTRYPE.i32_store8.value.hex:

			const i32_store8 = memarg(data, pointer);
			pointer += i32_store8.bytes;

			instr_result = Object.assign({ m: i32_store8.value }, INSTRYPE.i32_store8.value);
						
        break;

        case INSTRYPE.i32_store16.value.hex:

			const i32_store16 = memarg(data, pointer);
			pointer += i32_store16.bytes;

			instr_result = Object.assign({ m: i32_store16.value }, INSTRYPE.i32_store16.value);
						
        break;

        case INSTRYPE.i32_store32.value.hex:

			const i32_store32 = memarg(data, pointer);
			pointer += i32_store32.bytes;

			instr_result = Object.assign({ m: i32_store32.value }, INSTRYPE.i32_store32.value);
						
        break;

        case INSTRYPE.memory_size.value.hex:

            const magic_memory_size = ubyte(data, pointer);
            if(magic_memory_size.value !== MAGIC_MEMORY){
                throw `Memory Size Instruction got ${toHex(magic_memory_size.value)} but expected magic number ${toHex(MAGIC_MEMORY)}`;
            }
            pointer += magic_memory_size.bytes;

			instr_result = Object.assign({}, INSTRYPE.memory_size.value);            

        break;

        case INSTRYPE.memory_grow.value.hex:

            const magic_memory_grow = ubyte(data, pointer);
            if(magic_memory_grow.value !== MAGIC_MEMORY){
                throw `Memory Grow Instruction got ${toHex(magic_memory_grow.value)} but expected magic number ${toHex(MAGIC_MEMORY)}`;
            }
            pointer += magic_memory_grow.bytes;

			instr_result = Object.assign({}, INSTRYPE.memory_grow.value);            

        break;

		case INSTRYPE.i32_const.value.hex:

			const n_i32_const = i32(data, pointer);
			pointer += n_i32_const.bytes;

			instr_result = Object.assign({ n: n_i32_const.value }, INSTRYPE.i32_const.value);
						
		break;
        
        case INSTRYPE.i64_const.value.hex:

			const n_i64_const = i64(data, pointer);
			pointer += n_i64_const.bytes;

			instr_result = Object.assign({ n: n_i64_const.value }, INSTRYPE.i64_const.value);
						
        break;

        case INSTRYPE.f32_const.value.hex:

			const n_f32_const = f32(data, pointer);
			pointer += n_f32_const.bytes;

			instr_result = Object.assign({ n: n_f32_const.value }, INSTRYPE.f32_const.value);
						
		break;
        
        case INSTRYPE.f64_const.value.hex:

            const n_f64_const = f64(data, pointer);
			pointer += n_f64_const.bytes;

            instr_result = Object.assign({ n: n_f64_const.value }, INSTRYPE.f64_const.value);
            
        break;

        case INSTRYPE.i32_eqz.value.hex : instr_result = Object.assign({}, INSTRYPE.i32_eqz.value);  break;
        case INSTRYPE.i32_eq.value.hex  : instr_result = Object.assign({}, INSTRYPE.i32_eq.value);   break;
        case INSTRYPE.i32_ne.value.hex  : instr_result = Object.assign({}, INSTRYPE.i32_ne.value);   break;
        case INSTRYPE.i32_lt_s.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_lt_s.value); break;
        case INSTRYPE.i32_lt_u.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_lt_u.value); break;
        case INSTRYPE.i32_gt_s.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_gt_s.value); break;
        case INSTRYPE.i32_gt_u.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_gt_u.value); break;
        case INSTRYPE.i32_le_s.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_le_s.value); break;
        case INSTRYPE.i32_le_u.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_le_u.value); break;
        case INSTRYPE.i32_ge_s.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_ge_s.value); break;
        case INSTRYPE.i32_ge_u.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_ge_u.value); break;
        
        case INSTRYPE.i64_eqz.value.hex : instr_result = Object.assign({}, INSTRYPE.i64_eqz.value);  break;
        case INSTRYPE.i64_eq.value.hex  : instr_result = Object.assign({}, INSTRYPE.i64_eq.value);   break;
        case INSTRYPE.i64_ne.value.hex  : instr_result = Object.assign({}, INSTRYPE.i64_ne.value);   break;
        case INSTRYPE.i64_lt_s.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_lt_s.value); break;
        case INSTRYPE.i64_lt_u.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_lt_u.value); break;
        case INSTRYPE.i64_gt_s.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_gt_s.value); break;
        case INSTRYPE.i64_gt_u.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_gt_u.value); break;
        case INSTRYPE.i64_le_s.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_le_s.value); break;
        case INSTRYPE.i64_le_u.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_le_u.value); break;
        case INSTRYPE.i64_ge_s.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_ge_s.value); break;
        case INSTRYPE.i64_ge_u.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_ge_u.value); break;

        case INSTRYPE.f32_eq.value.hex: instr_result = Object.assign({}, INSTRYPE.f32_eq.value); break;
        case INSTRYPE.f32_ne.value.hex: instr_result = Object.assign({}, INSTRYPE.f32_ne.value); break;
        case INSTRYPE.f32_lt.value.hex: instr_result = Object.assign({}, INSTRYPE.f32_lt.value); break;
        case INSTRYPE.f32_gt.value.hex: instr_result = Object.assign({}, INSTRYPE.f32_gt.value); break;
        case INSTRYPE.f32_le.value.hex: instr_result = Object.assign({}, INSTRYPE.f32_le.value); break;
        case INSTRYPE.f32_ge.value.hex: instr_result = Object.assign({}, INSTRYPE.f32_ge.value); break;
        
        case INSTRYPE.f64_eq.value.hex   : instr_result = Object.assign({}, INSTRYPE.f64_eq.value);    break;
        case INSTRYPE.f64_ne.value.hex   : instr_result = Object.assign({}, INSTRYPE.f64_ne.value);    break;
        case INSTRYPE.f64_lt.value.hex   : instr_result = Object.assign({}, INSTRYPE.f64_lt.value);    break;
        case INSTRYPE.f64_gt.value.hex   : instr_result = Object.assign({}, INSTRYPE.f64_gt.value);    break;
        case INSTRYPE.f64_le.value.hex   : instr_result = Object.assign({}, INSTRYPE.f64_le.value);    break;
        case INSTRYPE.f64_ge.value.hex   : instr_result = Object.assign({}, INSTRYPE.f64_ge.value);    break;
        case INSTRYPE.i32_add.value.hex  : instr_result = Object.assign({}, INSTRYPE.i32_add.value);   break;
        case INSTRYPE.i32_sub.value.hex  : instr_result = Object.assign({}, INSTRYPE.i32_sub.value);   break;
        case INSTRYPE.i32_mul.value.hex  : instr_result = Object.assign({}, INSTRYPE.i32_mul.value);   break;
        case INSTRYPE.i32_div_s.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_div_s.value); break;

        case INSTRYPE.i32_div_u.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_div_u.value); break;
        case INSTRYPE.i32_rem_s.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_rem_s.value); break;
        case INSTRYPE.i32_rem_u.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_rem_u.value); break;
        case INSTRYPE.i32_or.value.hex   : instr_result = Object.assign({}, INSTRYPE.i32_or.value);    break;
        case INSTRYPE.i32_xor.value.hex  : instr_result = Object.assign({}, INSTRYPE.i32_xor.value);   break;
        case INSTRYPE.i32_and.value.hex  : instr_result = Object.assign({}, INSTRYPE.i32_and.value);   break;
        case INSTRYPE.i32_shl.value.hex  : instr_result = Object.assign({}, INSTRYPE.i32_shl.value);   break;
        case INSTRYPE.i32_shr_s.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_shr_s.value); break;
        case INSTRYPE.i32_shr_u.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_shr_u.value); break;
        
        case INSTRYPE.i64_clz.value.hex   : instr_result = Object.assign({}, INSTRYPE.i64_clz.value);    break;
        case INSTRYPE.i64_ctz.value.hex   : instr_result = Object.assign({}, INSTRYPE.i64_ctz.value);    break;
        case INSTRYPE.i64_popcnt.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_popcnt.value); break;
        case INSTRYPE.i64_add.value.hex   : instr_result = Object.assign({}, INSTRYPE.i64_add.value);    break;
        case INSTRYPE.i64_sub.value.hex   : instr_result = Object.assign({}, INSTRYPE.i64_sub.value);    break;
        case INSTRYPE.i64_mul.value.hex   : instr_result = Object.assign({}, INSTRYPE.i64_mul.value);    break;
        case INSTRYPE.i64_and.value.hex   : instr_result = Object.assign({}, INSTRYPE.i64_and.value);    break;
        case INSTRYPE.i64_or.value.hex    : instr_result = Object.assign({}, INSTRYPE.i64_or.value);     break;
        case INSTRYPE.i64_xor.value.hex   : instr_result = Object.assign({}, INSTRYPE.i64_xor.value);    break;
        case INSTRYPE.i64_shl.value.hex   : instr_result = Object.assign({}, INSTRYPE.i64_shl.value);    break;
        case INSTRYPE.i64_shr_s.value.hex : instr_result = Object.assign({}, INSTRYPE.i64_shr_s.value);  break;
        case INSTRYPE.i64_shr_u.value.hex : instr_result = Object.assign({}, INSTRYPE.i64_shr_u.value);  break;

        case INSTRYPE.f32_abs.value.hex     : instr_result = Object.assign({}, INSTRYPE.f32_abs.value);      break;
        case INSTRYPE.f32_neg.value.hex     : instr_result = Object.assign({}, INSTRYPE.f32_neg.value);      break;
        case INSTRYPE.f32_ceil.value.hex    : instr_result = Object.assign({}, INSTRYPE.f32_ceil.value);     break;
        case INSTRYPE.f32_floor.value.hex   : instr_result = Object.assign({}, INSTRYPE.f32_floor.value);    break;
        case INSTRYPE.f32_trunc.value.hex   : instr_result = Object.assign({}, INSTRYPE.f32_trunc.value);    break;
        case INSTRYPE.f32_nearest.value.hex : instr_result = Object.assign({}, INSTRYPE.f32_nearest.value);  break;
        case INSTRYPE.f32_sqrt.value.hex    : instr_result = Object.assign({}, INSTRYPE.f32_sqrt.value);     break;
        case INSTRYPE.f32_add.value.hex     : instr_result = Object.assign({}, INSTRYPE.f32_add.value);      break;
        case INSTRYPE.f32_sub.value.hex     : instr_result = Object.assign({}, INSTRYPE.f32_sub.value);      break;
        case INSTRYPE.f32_mul.value.hex     : instr_result = Object.assign({}, INSTRYPE.f32_mul.value);      break;
        case INSTRYPE.f32_div.value.hex     : instr_result = Object.assign({}, INSTRYPE.f32_div.value);      break;
        case INSTRYPE.f32_min.value.hex     : instr_result = Object.assign({}, INSTRYPE.f32_min.value);      break;
        case INSTRYPE.f32_max.value.hex     : instr_result = Object.assign({}, INSTRYPE.f32_max.value);      break;
        case INSTRYPE.f32_copysign.value.hex: instr_result = Object.assign({}, INSTRYPE.f64_copysign.value); break;
        
        case INSTRYPE.f64_abs.value.hex     : instr_result = Object.assign({}, INSTRYPE.f64_abs.value);      break;
        case INSTRYPE.f64_neg.value.hex     : instr_result = Object.assign({}, INSTRYPE.f64_neg.value);      break;
        case INSTRYPE.f64_ceil.value.hex    : instr_result = Object.assign({}, INSTRYPE.f64_ceil.value);     break;
        case INSTRYPE.f64_floor.value.hex   : instr_result = Object.assign({}, INSTRYPE.f64_floor.value);    break;
        case INSTRYPE.f64_trunc.value.hex   : instr_result = Object.assign({}, INSTRYPE.f64_trunc.value);    break;
        case INSTRYPE.f64_nearest.value.hex : instr_result = Object.assign({}, INSTRYPE.f64_nearest.value);  break;
        case INSTRYPE.f64_sqrt.value.hex    : instr_result = Object.assign({}, INSTRYPE.f64_sqrt.value);     break;
        case INSTRYPE.f64_add.value.hex     : instr_result = Object.assign({}, INSTRYPE.f64_add.value);      break;
        case INSTRYPE.f64_sub.value.hex     : instr_result = Object.assign({}, INSTRYPE.f64_sub.value);      break;
        case INSTRYPE.f64_mul.value.hex     : instr_result = Object.assign({}, INSTRYPE.f64_mul.value);      break;
        case INSTRYPE.f64_div.value.hex     : instr_result = Object.assign({}, INSTRYPE.f64_div.value);      break;
        case INSTRYPE.f64_min.value.hex     : instr_result = Object.assign({}, INSTRYPE.f64_min.value);      break;
        case INSTRYPE.f64_max.value.hex     : instr_result = Object.assign({}, INSTRYPE.f64_max.value);      break;
        case INSTRYPE.f64_copysign.value.hex: instr_result = Object.assign({}, INSTRYPE.f64_copysign.value); break;
        
        case INSTRYPE.i32_wrap_i64.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_wrap_i64.value); break;

        case INSTRYPE.i32_trunc_f32_s.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_trunc_f32_s.value); break;
        case INSTRYPE.i32_trunc_f32_u.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_trunc_f32_u.value); break;
        case INSTRYPE.i32_trunc_f64_s.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_trunc_f64_s.value); break;
        case INSTRYPE.i32_trunc_f64_u.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_trunc_f64_u.value); break;        

        case INSTRYPE.i64_extend_i32_s.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_extend_i32_s.value); break;
        case INSTRYPE.i64_extend_i32_u.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_extend_i32_u.value); break;

        case INSTRYPE.i64_trunc_f32_s.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_trunc_f32_s.value); break;
        case INSTRYPE.i64_trunc_f32_u.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_trunc_f32_u.value); break;
        case INSTRYPE.i64_trunc_f64_s.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_trunc_f64_s.value); break;
        case INSTRYPE.i64_trunc_f64_u.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_trunc_f64_u.value); break;

        case INSTRYPE.f32_convert_i32_s.value.hex: instr_result = Object.assign({}, INSTRYPE.f32_convert_i32_s.value); break;
        case INSTRYPE.f32_convert_i32_u.value.hex: instr_result = Object.assign({}, INSTRYPE.f32_convert_i32_u.value); break;

        case INSTRYPE.f32_demote_f64.value.hex: instr_result = Object.assign({}, INSTRYPE.f32_demote_f64.value); break;

        case INSTRYPE.i64_convert_i32_s.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_convert_i32_s.value); break;
        case INSTRYPE.i64_convert_i32_u.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_convert_i32_u.value); break;
        case INSTRYPE.i64_convert_i64_s.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_convert_i64_s.value); break;
        case INSTRYPE.i64_convert_i64_u.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_convert_i64_u.value); break;

        case INSTRYPE.f64_promote_f32.value.hex: instr_result = Object.assign({}, INSTRYPE.f64_promote_f32.value); break;

        case INSTRYPE.i32_reinterpret_f32.value.hex: instr_result = Object.assign({}, INSTRYPE.i32_reinterpret_f32.value); break;
        case INSTRYPE.i64_reinterpret_f64.value.hex: instr_result = Object.assign({}, INSTRYPE.i64_reinterpret_f64.value); break;

        case INSTRYPE.f32_reinterpret_i32.value.hex: instr_result = Object.assign({}, INSTRYPE.f32_reinterpret_i32.value); break;
        case INSTRYPE.f64_reinterpret_i64.value.hex: instr_result = Object.assign({}, INSTRYPE.f64_reinterpret_i64.value); break;

        default: throw `INSTRTYPE ${toHex(magic.value)} Not found, expected: \n| ${Object.values(INSTRYPE).map(e => `${toHex(e.value.hex, 2)} -> ${e.value.type}`).join("\n| ")}`;
    }

    return {
        value: instr_result,
        bytes: pointer - i
    };
}

module.exports = { expr, instr };