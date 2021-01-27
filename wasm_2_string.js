const { toStringHex } = require("./helper");
const SEPARATOR = "  ";


function array_2_string(value){
    return `"${value.reduce((s, a) => s + (a >= 0x20 && a <= 0x7E ? String.fromCharCode(a) : toStringHex(a, 2)), '')}"`; //
}

function access_2_string(wasm, instruction){
    if(instruction.hasOwnProperty("x")){
        return " $" + instruction.x;
    }else if(instruction.hasOwnProperty("index")){
        const element = index_2_element(wasm, instruction.index);
        return " $" + element.func.name;
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

function descriptor_params_2_string(params){
    return params.length === 0 ? '' : ` (param ${params.map(e => `${e.type}`).join(' ')})`;
}

function descriptor_2_string(wasm, descriptor){
    const section = wasm.find(e => e.name === descriptor.type).value;
    const value = section[descriptor.d];
    switch(descriptor.type){
        case "memory": return "(memory $"+ desc.d;
        case "func": return "(func ";
        case "type": return descriptor_params_2_string(value.rt1) + results_2_string(value.rt2);
    }
    return '';
}

function instruction_2_string(wasm, value){
    return value.map(v => `${v.name}${access_2_string(wasm, v)}`).join("\n");
}

function limits_2_string(value){
    return ` ${value.min}${value.type === 'clamp' ? ` ${value.max}` : ''}`;
}

function function_2_string(data){
    return "$" + data.module + '.' + data.name;
}

function import_2_string(wasm, desc){
    const imports = wasm.find(e => e.name === "import").value.filter(e => e.desc.type === desc.type);
    const data = imports[desc.d];
    return ` (import "${data.module}" "${data.name}"`;
}

function import_subsection_2_string(wasm, import_subsection, t = SEPARATOR){

    return import_subsection.map((data, i) => {
        
        console.log(data);
        let result = SEPARATOR + "(";
        switch(data.desc.type){
            case "memory":
                result += "memory " + function_2_string(data) + " (;" + i + ";)" + limits_2_string(data.desc.mem);// + import_2_string(wasm, data.desc) + ')';
            break;
            case "table":
                result += "table " + function_2_string(data) + " (;" + i + ";)" + limits_2_string(data.desc.table.lim) + " anyfunc";
            break;
            case "type":
                result += "func " + function_2_string(data) + " (;" + i + ";)" + import_2_string(wasm, data.desc) + ')' + descriptor_2_string(wasm, data.desc);
            break;
            case "global":
                result += "global "+ function_2_string(data) + " (;" + i + ";)" + " " + data.desc.global.valtype.type;
            break;
        }
        result += ')';
        return result;
    }).join("\n");
}

function import_section_2_string(wasm, t = SEPARATOR){
    
    let result = "";
    result += import_subsection_2_string(wasm, wasm.imports.filter(e => e.desc.type === "memory"), t = SEPARATOR) + '\n';
    result += import_subsection_2_string(wasm, wasm.imports.filter(e => e.desc.type === "table"), t = SEPARATOR) + '\n';
    result += import_subsection_2_string(wasm, wasm.imports.filter(e => e.desc.type === "type"), t = SEPARATOR) + '\n';
    result += import_subsection_2_string(wasm, wasm.imports.filter(e => e.desc.type === "global"), t = SEPARATOR) + '\n';
    return result;
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

function element_section_2_string(wasm, t = SEPARATOR){
    const elements = wasm.find(e => e.name === "elem");
    if(elements === undefined) return '';

    return elements.value.map((data) => {
        const memorys = data.offset.map(e => offset_2_string(wasm, e)).join(" ");
        const functions = data.init.map(e => " $func" + e).join(" ");
        return SEPARATOR + "(elem" + memorys + functions + ')';
    }).join('');
}

function table_section_2_string(wasm, t = SEPARATOR){
    const tables = wasm.find(e => e.name === 'table');
    return tables.value.map((data, i) => SEPARATOR + "(table (;" + i + ";) "+ limits_2_string(data.lim)+" anyfunc)").join("\n");
}

function global_section_2_string(wasm, t = SEPARATOR){
    const globals = wasm.find(e => e.name === "global").value;
    const imports = wasm.find(e => e.name === "import").value.filter(e => e.desc.type === "global");
    return globals.filter(e => e.init.find(v => v.name.startsWith("global"))).map((data, i) => {
        const desc = data.init[0].x;
        return SEPARATOR + "(global (;" + (desc - 1) + ";) " + import_2_string(imports, desc) + ') '+ data.type.valtype.type +')';
    }).join("\n");
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

function get_n_2_consume(wasm, instruction){
    if(instruction.hasOwnProperty("n_consume")){
        return instruction.n_consume;
    }else if(instruction.name === "call"){
        const element = index_2_element(wasm, instruction.index);
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

function index_2_element(wasm, index){
    const section = wasm.find(e => e.name === index.type).value;
    return section[index.i];
}

function parse_wasm(wasm){
    let functions = [];

    // Import
    const imports = wasm.find(e => e.name === "import").value || [];
    const functions_import = imports.filter(e => e.desc.type === "type");
    
    const functions_import_type = functions_import.map(e => index_2_element(wasm, e.desc));
    
    functions = functions.concat(functions_import.map((_, i) => new Object({
        function: functions_import[i],
        pipe: functions_import_type[i]
    })));

    // Export
    const exports = wasm.find(e => e.name === "export").value || [];
    const functions_export = exports.filter(e => e.desc.type === "func");
    
    const functions_descriptors = wasm.find(e => e.name === "func");
    const functions_export_type = functions_descriptors.value.map(type_descriptor => index_2_element(wasm, type_descriptor));

    functions = functions.concat(functions_export.map((_, i) => new Object({
        function: functions_export[i],
        pipe: functions_export_type[i]
    })));

    return {
        data: wasm,
        imports: imports,
        exports: exports,
        functions: functions
    };
}

function wasm_2_string(wasm){
    const parsed_wasm = parse_wasm(wasm);

    return '(module\n'+
        import_section_2_string(parsed_wasm)+'\n'+
        //element_section_2_string(wasm)+'\n'+
        //data_section_2_string(wasm.find(e => e.name === 'data'))+'\n'+
        //export_section_2_string(wasm)+'\n'+
        //function_section_2_string(wasm)+'\n'+
    ')';

}


module.exports = { wasm_2_string, memory_section_2_string, export_section_2_string, data_section_2_string };