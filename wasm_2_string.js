const { toStringHex } = require("./helper");
const { globalidx } = require("./wasm/indices");
const SEPARATOR = "  ";


function array_2_string(value){
    return `"${value.reduce((s, a) => s + (a >= 0x20 && a <= 0x7E ? String.fromCharCode(a) : toStringHex(a, 2)), '')}"`; //
}

function descriptor_params_2_string(params){
    return params.length === 0 ? '' : ` (param ${params.map(e => `${e.type}`).join(' ')})`;
}

function instruction_2_string(wasm, value){
    return value.map(v => `${v.name}${access_2_string(wasm, v)}`).join("\n");
}

function function_2_string(data){
    return "$" + data.module + '.' + data.name;
}

function offset_2_string(wasm, offset){
    let result = " (" + offset.name;
    if(offset.name.startsWith("global")){
        const globals = wasm.find(e => e.name === "import").value.filter(e => e.desc.type === "global");
        const name = globals[offset.x];
        result += ' ' + function_2_string(name);
    }else{
        result += " local";
    }
    result += ')';
    return result;
}

function table_section_2_string(wasm, t = SEPARATOR){
    const tables = wasm.find(e => e.name === 'table');
    return tables.value.map((data, i) => SEPARATOR + "(table (;" + i + ";) "+ limits_2_string(data.lim)+" anyfunc)").join("\n");
}

function memory_section_2_string(wasm, t = SEPARATOR){
    const tables = wasm.find(e => e.name === 'memory');
    return tables.value.map((data, i) => SEPARATOR + "(memory (;"+ i +";) " + limits_2_string(data.mt) + ")").join("\n");
}

function data_section_2_string(section, t = SEPARATOR){
    if(!(section.hasOwnProperty("name") && section.name === "data")){
        throw `Section Object could not be decoded, expected attribute name='data'`;
    }

    return section.value.map(data => `${SEPARATOR}(data (${instruction_2_string(data.offset)}) ${array_2_string(data.init)})`).join("\n");
}

function export_section_2_string(wasm, t = SEPARATOR){
    const exports = wasm.find(e => e.name === 'export');
    return exports.value.map(data => `${SEPARATOR}(export "${data.name}" ${descriptor_2_string(wasm, data)})`).join("\n");
}

function params_2_string(params){
    return params.length === 0 ? '' : `${params.map(e => ` (param XX ${e.type})`).join(' ')}`;
}

function results_2_string(results){
    return results.length === 0 ? '' : `${results.map(e => ` (result ${e.type})`).join(' ')}`;
}

function locals_2_string(locals, t){
    return locals.length === 0 ? '' : `${locals.map(e => t + "(local XX "+ e.type +')').join('\n')}\n`;
}


function body_2_string(wasm, body, t = SEPARATOR){
    let code_2_string = "";
    while(body.length > 0){
        code_2_string = expresion_2_string(wasm, body, t) + "\n" + code_2_string;
    }
    return code_2_string;
}
//////////////////

function descriptor_2_element(wasm, index){

}

function function_section_2_string(wasm, t = SEPARATOR){

    /*const functions_type = wasm.find(e => e.name === 'type').value;
    const functions = wasm.find(e => e.name === 'export').value;
    const codes = wasm.find(e => e.name === 'code').value;
    const datas = wasm.find(e => e.name === 'data').value;
    const globals = wasm.find(e => e.name === 'global').value;

    const functions_idx = wasm.find(e => e.name === 'func').value;
    return functions_idx.map((idx, i) => {
        const type = functions_type[idx];
        const func = functions.find(e => e.desc.d === idx);
        const data = datas[idx];
        const code = codes[i].code;
        
        let locals = locals_2_string(code.locals, t + SEPARATOR);
        let body = body_2_string(wasm, code.body, t + SEPARATOR);

        return SEPARATOR + "(func $"+ func.name + " (; " + idx + " ;) " + params_2_string(type.rt1) + results_2_string(type.rt2) + '\n' +
            locals +
            body +
        SEPARATOR + ')';
    }).join("\n");*/
}

function limits_2_string(value){
    return ` ${value.min}${value.type === 'clamp' ? ` ${value.max}` : ''}`;
}

function element_section_2_string(wasm, t = SEPARATOR){
    return wasm.elements.map((data) => {
        // TODO: Check if these indices have names with that indices
        return SEPARATOR + "(elem" + expresion_2_string(wasm, data.offset, ' ') + data.init.map(e => " $func" + e.i).join("") + ')';
    }).join('');
}

function index_2_element(wasm, index){
    switch(index.type){
        case "globalidx":
            return wasm.imports.globaltype[index.i];
        break;
    }
}

function access_2_string(wasm, instruction){
    if(instruction.hasOwnProperty("x")){
        return " $" + instruction.x;
    }else if(instruction.hasOwnProperty("index")){
        //console.log(wasm.imports, instruction.index);
        const element = index_2_element(wasm, instruction.index);
        return ' ' + function_2_string(element);
    }else if(instruction.hasOwnProperty("n")){
        return ' ' + instruction.n;
    }else if(instruction.hasOwnProperty("m")){
        // TODO ADD: .align: 2^.align
        // let align = 1 << access.m.align;
        return ' offset=' + instruction.m.offset;
    }else if(instruction.hasOwnProperty("bt")){
        // TODO: CREATE LABELS
        return ' ##';
    }else if(instruction.hasOwnProperty("label")){
        // TODO: USE LABELS
        return ' ##';
    }

    return '';
}

function get_n_2_consume(wasm, instruction){
    if(instruction.hasOwnProperty("n_consume")){
        return instruction.n_consume;
    }else if(instruction.name === "call"){
        const element = index_2_element(wasm.functions, instruction.index);
        return element.pipe.rt1.length;
    }
    return 0;
}

function expresion_2_string(wasm, expresion, t){
    let result = "";

    let instruction = expresion.pop();

    result += t + '(' + instruction.name + access_2_string(wasm, instruction);
    
    let n_consume = get_n_2_consume(wasm, instruction);
    if(n_consume > 0){
        let instructions = "";
        for(let i = 0; i < n_consume; ++i){
            instructions = expresion_2_string(wasm, expresion, t + SEPARATOR) + '\n' + instructions;
        }
        result += '\n' + instructions + t;
    }else if(["block", "loop"].find(e => e === instruction.name)){
        result += '\n' + body_2_string(wasm, instruction.instr, t + SEPARATOR) + t;
    }
    result += ')';

    return result;
}

function type_2_string(data){
    let result = "";
    switch(data.type){
        case "globaltype":
            // TODO: Check var / const
            result += " (mut " + data.valtype.type + ')';
        break;
    }
    return result;
}

function global_section_2_string(wasm, t = SEPARATOR){
    return wasm.globals.map((data, i) => {
        return SEPARATOR + "(global $global" + i + type_2_string(data.type) + expresion_2_string(wasm, data.init, ' ') + ')';
    }).join("\n");
}

function descriptor_2_string(wasm, data){

    /*const section = wasm.find(e => e.name === descriptor.type).value;
    const value = section[descriptor.d];
    switch(descriptor.type){
        case "memory": return "(memory $"+ desc.d;
        case "func": return "(func ";
        case "type": return ;
    }*/
    return descriptor_params_2_string(data.pipe.arguments.types) + results_2_string(data.pipe.result.types);
}

function import_2_string(wasm, data){
    return ` (import "${data.module}" "${data.name}"`;
}

function import_subsections_2_string(wasm, t = SEPARATOR){
    
    return wasm.imports.data.map((data, i) => {
        let result = t + "(";
        if(data.hasOwnProperty("index")){ // Index
            const func = wasm.functions.find(e => e.type === "import" && e.function.name == data.name);
            result += "func " + function_2_string(data) + " (;" + i + ";)" + import_2_string(wasm, func.function) + ')' + descriptor_2_string(wasm, func);
        }else{ // Type
            switch(data.type){
                case "memtype":
                    result += "memory " + function_2_string(data) + " (;" + i + ";)" + import_2_string(wasm, data) + ')' + limits_2_string(data.desc.limits);
                break;
                case "tabletype":
                    result += "table " + function_2_string(data) + " (;" + i + ";)" + import_2_string(wasm, data) + ')' + limits_2_string(data.desc.limits) + " anyfunc";
                break;
                case "globaltype":
                    result += "global "+ function_2_string(data) + " (;" + i + ";)" + import_2_string(wasm, data) + ") " + data.desc.valtype.type;
                break;
            }
        }
        result += ')';
        return result;
    }).join("\n");
}

function global_index_2_element(wasm, index){
    const section = wasm.find(e => e.name === index.type.replace("idx", '')).value;
    return section[index.i];
}

function parse_wasm(wasm){
    let functions = [];

    // Import
    const imports = wasm.find(e => e.name === "import").value || [];
    const imports_indexes = imports.filter(e => e.hasOwnProperty("index"));
    const imports_types = imports.filter(e => e.hasOwnProperty("type"));
    
    const functions_import_type = imports_indexes.map(e => global_index_2_element(wasm, e.index));
    
    functions = functions.concat(imports_indexes.map((_, i) => new Object({
        function: imports_indexes[i],
        pipe: functions_import_type[i],
        type: "import"
    })));

    // Export
    const exports = wasm.find(e => e.name === "export").value || [];
    const exports_indexes = exports.filter(e => e.hasOwnProperty("index"));

    const functions_descriptors = wasm.find(e => e.name === "func");
    const functions_export_type = functions_descriptors.value.map(index => global_index_2_element(wasm, index));

    functions = functions.concat(exports_indexes.map((_, i) => new Object({
        function: exports_indexes[i],
        pipe: functions_export_type[i],
        type: "export"
    })));

    // Globals
    const globals = wasm.find(e => e.name === "global").value || [];

    // Elements
    const elements = wasm.find(e => e.name === "elem").value || [];

    return {
        data: wasm,
        globals: globals,
        elements: elements,
        imports: {
            data: imports,
            typeidx: imports_indexes,
            tabletype: imports_types.filter(e => e.type.type === "tabletype"),
            memtype: imports_types.filter(e => e.type.type === "memtype"),
            globaltype: imports_types.filter(e => e.type.type === "globaltype"),
        },
        exports: {
            data: exports,
            funcidx: exports_indexes
        },
        functions: functions
    };
}

function wasm_2_string(wasm){
    const parsed_wasm = parse_wasm(wasm);

    return '(module\n'+
        import_subsections_2_string(parsed_wasm)+'\n'+
        global_section_2_string(parsed_wasm)+'\n'+
        element_section_2_string(parsed_wasm)+'\n'+
        //data_section_2_string(wasm.find(e => e.name === 'data'))+'\n'+
        //export_section_2_string(wasm)+'\n'+
        //function_section_2_string(wasm)+'\n'+
    ')';

}


module.exports = { wasm_2_string, memory_section_2_string, export_section_2_string, data_section_2_string };