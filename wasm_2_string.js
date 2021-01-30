const { toStringHex } = require("./helper");
const { globalidx } = require("./wasm/indices");
const SEPARATOR = "  ";


function array_2_string(value){
    return `"${value.reduce((s, a) => s + (a >= 0x20 && a <= 0x7E ? String.fromCharCode(a) : toStringHex(a, 2)), '')}"`; //
}

function function_2_string(data){
    return "$" + (data.hasOwnProperty("module") ? (data.module + '.') : '') + data.name;
}

function limits_2_string(value){
    return ` ${value.min}${value.type === 'clamp' ? ` ${value.max}` : ''}`;
}

function index_2_element(wasm, context, instruction){
    switch(instruction.index.type){
        case "globalidx":
            return wasm.imports.globaltype[instruction.index.i];
        break;
        case "funcidx":
            return wasm.functions[instruction.index.i];
        break;
        case "localidx":
            return instruction.index.i;
        break;
        case "labelidx":
            return instruction.index.i;
        break;
    }
}

function index_2_string(wasm, context, instruction){
    const element = index_2_element(wasm, context, instruction);
    switch(instruction.index.type){
        case "globalidx":
            return function_2_string(element);
        break;
        case "funcidx":
            return function_2_string(element.function);
        break;
        case "localidx":
            return "$var" + element;
        break;
        case "labelidx":
            return "$label$" + element;
        break;
    }
}

function access_2_string(wasm, context, instruction){
    if(instruction.hasOwnProperty("x")){
        return " $" + instruction.x;
    }else if(instruction.hasOwnProperty("index")){
        return ' ' + index_2_string(wasm, context, instruction);
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
        return ' ##';
    }

    return '';
}

function get_n_2_consume(wasm, context, instruction){
    if(instruction.hasOwnProperty("n_consume")){
        return instruction.n_consume;
    }else if(instruction.name === "call"){
        const element = index_2_element(wasm, context, instruction);
        return element.pipe.arguments.types.length;
    }
    return 0;
}

function locals_2_string(wasm, func, t){
    return func.body.code.locals.length === 0 ? '' : (t + func.body.code.locals.map((e, i) => "(local $var"+ (func.pipe.arguments.types.length + i) + ' ' + e.type +')').join(' ') + '\n');
}

function body_2_string(wasm, context, t = SEPARATOR){
    let code_2_string = "";
    while(context.body.length > 0){
        code_2_string = expresion_2_string(wasm, context, t) + code_2_string;
    }
    return code_2_string;
}

function expresion_2_string(wasm, context, t){
    let result = "";

    let instruction = context.body.pop();

    result += t + instruction.name + access_2_string(wasm, context, instruction) + '\n';
    
    let n_consume = get_n_2_consume(wasm, context, instruction);

    if(n_consume > 0){
        let instructions = new Array(n_consume);
        for(let i = 0; i < n_consume; ++i){
            instructions[i] = expresion_2_string(wasm, context, t + SEPARATOR);
        }
        result += instructions.join('');
    }else if(["block", "loop"].find(e => e === instruction.name)){
        result += body_2_string(wasm, { locals: [], body: instruction.instr }, t + SEPARATOR);
    }

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

function import_params_2_string(params){
    return params.length === 0 ? '' : ` (param ${params.map(e => e.type).join(' ')})`;
}

function export_params_2_string(params){
    return params.length === 0 ? '' : ` (param ${params.map((e, i) => "$var" + i + ' ' + e.type).join(' ')})`;
}

function results_2_string(results){
    return results.length === 0 ? '' : `${results.map(e => ` (result ${e.type})`).join(' ')}`;
}

function import_descriptor_2_string(wasm, func){
    return import_params_2_string(func.pipe.arguments.types) + results_2_string(func.pipe.result.types);
}

function export_descriptor_2_string(wasm, func){
    return export_params_2_string(func.pipe.arguments.types) + results_2_string(func.pipe.result.types);
}

function import_2_string(data){
    return ` (import "${data.module}" "${data.name}"`;
}

function export_2_string(data){
    return ` (export "${data.name}"`;
}

function import_section_2_string(wasm, t = SEPARATOR){
    return wasm.imports.length === 0 ? '' : (wasm.imports.data.map((data, i) => {
        let result = t + "(";
        if(data.hasOwnProperty("index")){ // Index
            const func = wasm.functions.find(e => e.type === "import" && e.function.name == data.name);
            result += "func " + function_2_string(data) + " (;" + i + ";)" + import_2_string(func.function) + ')' + import_descriptor_2_string(wasm, func);
        }else{ // Type
            switch(data.type){
                case "memtype":
                    result += "memory " + function_2_string(data) + " (;" + i + ";)" + import_2_string(data) + ')' + limits_2_string(data.desc.limits);
                break;
                case "tabletype":
                    result += "table " + function_2_string(data) + " (;" + i + ";)" + import_2_string(data) + ')' + limits_2_string(data.desc.limits) + " anyfunc";
                break;
                case "globaltype":
                    result += "global "+ function_2_string(data) + " (;" + i + ";)" + import_2_string(data) + ") " + data.desc.valtype.type;
                break;
            }
        }
        result += ')';
        return result;
    }).join("\n") + '\n');
}

function global_section_2_string(wasm, t = SEPARATOR){
    return wasm.globals.length === 0 ? '' : (wasm.globals.map((data, i) => {
        return SEPARATOR + "(global $global" + i + type_2_string(data.type) + " (" + expresion_2_string(wasm, { locals: [], body: data.init }, '') + ')';
    }).join('\n') + '\n');
}

function element_section_2_string(wasm, t = SEPARATOR){
    return wasm.elements.length === 0 ? '' : (wasm.elements.map((data) => {
        // TODO: Check if these indices have names with that indices
        return SEPARATOR + "(elem (" + expresion_2_string(wasm, { locals: [], body: data.offset }, '') + data.init.map(e => " $func" + e.i).join("") + ')';
    }).join('\n') + '\n');
}

function export_section_2_string(wasm, t = SEPARATOR){
    return wasm.exports.length === 0 ? '' : (wasm.exports.data.map((data, i) => {
        let result = t + '(';
        switch(data.index.type){
            case "memidx":
                result += "; TODO: Google format for EXPORT MEMIDX ;";
            break;
            case "funcidx":
                const func = wasm.functions.find(e => e.type === "export" && e.function.name == data.name);
                result += "func " + function_2_string(data) + " (;" + i + ";)" + export_2_string(func.function) + ')' + export_descriptor_2_string(wasm, func) + '\n';
                result += locals_2_string(wasm, func, t + SEPARATOR);
                result += body_2_string(wasm, func.body.code, t + SEPARATOR);
                result += SEPARATOR;
            break;
        }
        result += ')';
        return result;
    }).join("\n") + '\n')
}

function global_index_2_element(wasm, index){
    const section = wasm.find(e => e.name === index.type.replace("idx", '')).value;
    return section[index.i];
}

function parse_wasm(wasm){
    let functions = [];

    // Import
    const imports = (wasm.find(e => e.name === "import") || { value: [] }).value;
    const imports_indexes = imports.filter(e => e.hasOwnProperty("index") && e.index.type === "typeidx");
    const imports_types = imports.filter(e => e.hasOwnProperty("type"));
    
    const functions_import_type = imports_indexes.map(e => global_index_2_element(wasm, e.index));
    
    functions = functions.concat(imports_indexes.map((_, i) => new Object({
        function: imports_indexes[i],
        pipe: functions_import_type[i],
        type: "import"
    })));

    // Export
    const exports = (wasm.find(e => e.name === "export") || { value: [] }).value;
    const exports_indexes = exports.filter(e => e.hasOwnProperty("index") && e.index.type === "funcidx");
    
    const functions_descriptors = (wasm.find(e => e.name === "func") || { value: [] }).value;
    const functions_export_body = (wasm.find(e => e.name === "code") || { value: [] }).value;
    const functions_export_type = functions_descriptors.map(index => global_index_2_element(wasm, index));
    functions = functions.concat(exports_indexes.map((_, i) => new Object({
        function: exports_indexes[i],
        pipe: functions_export_type[i],
        body: functions_export_body[i],
        type: "export"
    })));

    // Globals
    const globals = (wasm.find(e => e.name === "global") || { value: [] }).value;

    // Elements
    const elements = (wasm.find(e => e.name === "elem") || { value: [] }).value;

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
        import_section_2_string(parsed_wasm)+
        global_section_2_string(parsed_wasm)+
        element_section_2_string(parsed_wasm)+
        //data_section_2_string(parsed_wasm)+'\n'+
        export_section_2_string(parsed_wasm)+
        //function_section_2_string(parsed_wasm)+'\n'+
    ')';

}


module.exports = { wasm_2_string };