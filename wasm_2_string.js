const { code } = require("./globals");
const { toStringHex } = require("./helper");
const SEPARATOR = "  ";


function array_2_string(value){
    return `"${value.reduce((s, a) => toStringHex(a, 2) + s, '')}"`;
}

function access_2_string(access, functions){
    if(access.hasOwnProperty("x")){
        return " $" + (access.name === "call" ? functions[access.x].name : access.x);
    }else if(access.hasOwnProperty("n")){
        return ' ' + access.n;
    }else if(access.hasOwnProperty("m")){
        // TODO ADD: .align: 2^.align
        // let align = 1 << access.m.align;
        return ' offset=' + access.m.offset;
    }else if(access.hasOwnProperty("bt")){
        // TODO: CREATE LABELS
        return ' ##';
    }else if(access.hasOwnProperty("label")){
        // TODO: USE LABELS
        return ' ##';
    }

    return '';
}

function instruction_2_string(value){
    return value.map(v => `${v.name} ${access_2_string(v)}`).join("\n");
}

function limits_2_string(value){
    return `${value.min}${value.type === 'max' ? ` ${value.max}` : ''}`;
}

function table_section_2_string(section, t = SEPARATOR){
    if(!(section.hasOwnProperty("name") && section.name === "table")){
        throw `Section Object could not be decoded, expected attribute name='table'`;
    }

    // WHAT IS XX -> et
    return section.value.map(data => `${SEPARATOR}(table ${limits_2_string(data.lim)} XX))`).join("\n");
}

function memory_section_2_string(section, t = SEPARATOR){
    if(!(section.hasOwnProperty("name") && section.name === "memory")){
        throw `Section Object could not be decoded, expected attribute name='memory'`;
    }

    // WHAT IS XX -> Stack of names
    return section.value.map(data => `${SEPARATOR}(memory XX ${limits_2_string(data.mt)}))`).join("\n");
}

function data_section_2_string(section, t = SEPARATOR){
    if(!(section.hasOwnProperty("name") && section.name === "data")){
        throw `Section Object could not be decoded, expected attribute name='data'`;
    }

    return section.value.map(data => `${SEPARATOR}(data (${instruction_2_string(data.offset)}) ${array_2_string(data.init)})`).join("/n");
}

function export_section_2_string(section, t = SEPARATOR){
    if(!(section.hasOwnProperty("name") && section.name === "export")){
        throw `Section Object could not be decoded, expected attribute name='export'`;
    }
    // TODO What is XXX -> Stack of names dep on type
    return section.value.map(data => `${SEPARATOR}(export "${data.name}" (${data.desc.type} XXX))`).join("\n");
}

function params_2_string(params){
    return params.length === 0 ? '' : `${params.map(e => `(param XX ${e.type})`).join(' ')} `;
}

function results_2_string(results){
    return results.length === 0 ? '' : `${results.map(e => `(result ${e.type})`).join(' ')}`;
}

function locals_2_string(locals, t){
    return locals.length === 0 ? '' : `${locals.map(e => t + "(local XX "+ e.type +')').join('\n')}\n`;
}

function get_n_2_consume(instruction, functions, functions_type){
    if(instruction.hasOwnProperty("n_consume")){
        return instruction.n_consume;
    }else if(instruction.name === "call"){
        return functions_type[instruction.x].rt1.length;
    }
    return 0;
}

function expresion_2_string(expresion, functions, functions_type, t){
    let result = "";

    let instruction = expresion.pop();

    result += t + '(' + instruction.name + access_2_string(instruction, functions, functions_type);
    let n_consume = get_n_2_consume(instruction, functions, functions_type);
    if(n_consume > 0){
        let instructions = "";
        for(let i = 0; i < n_consume; ++i){
            instructions = expresion_2_string(expresion, functions, functions_type, t + SEPARATOR) + '\n' + instructions;
        }
        result += '\n' + instructions + t;
    }else if(["block", "loop"].find(e => e === instruction.name)){
        result += '\n' + body_2_string(instruction.instr, functions, functions_type, t + SEPARATOR) + t;
    }
    result += ')';

    return result;
}

function body_2_string(body, functions, functions_type, t = SEPARATOR){
    let code_2_string = "";
    while(body.length > 0){
        code_2_string = expresion_2_string(body, functions, functions_type, t) + "\n" + code_2_string;
    }
    return code_2_string;
}

function function_section_2_string(wasm, t = SEPARATOR){
    const functions_type = wasm.find(e => e.name === 'type').value;
    const functions_idx = wasm.find(e => e.name === 'function').value;
    const functions = wasm.find(e => e.name === 'export').value.filter(e => e.desc.type === 'func');
    const codes = wasm.find(e => e.name === 'code').value;
    const datas = wasm.find(e => e.name === 'data').value;
    const globals = wasm.find(e => e.name === 'global').value;

    return functions_idx.map(idx => {
        const type = functions_type[idx];
        const func = functions[idx];
        const code = codes[idx].code;
        const data = datas[idx];
        let locals = locals_2_string(code.locals, t + SEPARATOR);
        let body = body_2_string(code.body, functions, functions_type, t + SEPARATOR);

        return SEPARATOR + "(func $"+ func.name + " (; " + idx + " ;) " + params_2_string(type.rt1) + results_2_string(type.rt2) + '\n' +
            locals +
            body +
        SEPARATOR + ')';
    }).join("\n");
}

function wasm_2_string(wasm){

    return '(module\n'+
        table_section_2_string(wasm.find(e => e.name === 'table'))+'\n'+
        memory_section_2_string(wasm.find(e => e.name === 'memory'))+'\n'+
        data_section_2_string(wasm.find(e => e.name === 'data'))+'\n'+
        export_section_2_string(wasm.find(e => e.name === 'export'))+'\n'+
        function_section_2_string(wasm)+'\n'+
    ')';
    //console.log(wasm.find(e => e.name === 'function'));
    //console.log(wasm.find(e => e.name === 'code').value.map(e => e.code.body)[idx]);


}


module.exports = { wasm_2_string, memory_section_2_string, export_section_2_string, data_section_2_string };