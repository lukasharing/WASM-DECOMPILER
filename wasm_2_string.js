const { toStringHex } = require("./helper");
const { globalidx } = require("./wasm/indices");
const SEPARATOR = "  ";


function array_2_string(value){
    return `"${value.reduce((s, a) => s + (a >= 0x20 && a <= 0x7E ? String.fromCharCode(a) : toStringHex(a, 2)), '')}"`; //
}

function function_2_string(data){
    return " $" + (data.hasOwnProperty("module") ? (data.module + '.') : '') + data.name;
}

function limits_2_string(value){
    return ' ' + value.min + (value.type === 'clamp' ? (' ' + value.max) : '');
}

function index_2_element(wasm, context, instruction){
    switch(instruction.index.type){
        case "globalidx":
            return wasm.globals[instruction.index.i];
        break;
        case "funcidx":
            return wasm.functions.data[instruction.index.i];
        break;
        case "localidx":
            return instruction.index.i;
        break;
        case "labelidx":
            return instruction.index.i;
        break;
        case "tableidx":
            return wasm.tables[instruction.index.i];
        break;
        case "typeidx":
            return wasm.types[instruction.index.i];
        break;
    }
}

function index_2_string(wasm, context, instruction){
    const element = index_2_element(wasm, context, instruction);
    switch(instruction.index.type){
        case "globalidx":
            return ""; //mutability_2_string(wasm, element);
        break;
        case "funcidx":
            return function_2_string(element);
        break;
        case "localidx":
            return " $var" + element;
        break;
        case "labelidx":
            return " $label$" + element;
        break;
        case "tableidx":
            return ' ' + export_2_string(instruction) + limits_2_string(element.type.limits) + " funcref";
        break;
        case "typeidx":
            return import_descriptor_2_string(wasm, element);
        break;
    }
}

function access_2_string(wasm, context, instruction){
    if(instruction.hasOwnProperty("x")){
        return " $" + instruction.x;
    }else if(instruction.hasOwnProperty("index")){
        return index_2_string(wasm, context, instruction);
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
    }else if(instruction.name === "call_indirect"){
        const element = index_2_element(wasm, context, instruction);
        return element.arguments.types.length;
    }
    return 0;
}

function locals_2_string(wasm, func, t){
    return func.code.code.locals.length === 0 ? '' : (t + func.code.code.locals.map((e, i) => "(local $var"+ (func.pipe.arguments.types.length + i) + ' ' + e.type +')').join(' ') + '\n');
}

function expresion_2_string(wasm, context, t){
    let result = "";

    let instruction = context.body.pop();
    result += t + instruction.name + access_2_string(wasm, context, instruction);
    
    let n_consume = get_n_2_consume(wasm, context, instruction);
    if(n_consume > 0){
        let instructions = new Array(n_consume);
        for(let i = 0; i < n_consume; ++i){
            instructions[i] = expresion_2_string(wasm, context, t + SEPARATOR);
        }
        result += '\n' + instructions.reverse().join('\n');
    }else if(["block", "loop", "if"].find(e => e === instruction.name)){
        result += '\n' + body_2_string(wasm, { locals: [], body: instruction.instr }, t + SEPARATOR) + '\n';
        result += t + "end" + access_2_string(wasm, context, instruction);
    }

    return result;
}

function body_2_string(wasm, context, t = SEPARATOR){
    let code_2_string = new Array();
    while(context.body.length > 0){
        code_2_string.push(expresion_2_string(wasm, context, t));
    }
    return code_2_string.reverse().join('\n');
}

function mutability_2_string(wasm, data){
    let result = "";
    switch(data.type.mutability.type){
        case "var":
            return " $global" + i + " (mut " + data.valtype.type + ')';
        break;
        case "const":
            return ' ' + data.type.valtype.type;
        break;
    }

    return  result;
}

function type_2_string(wasm, data){
    let result = "";
    switch(data.type){
        case "globaltype":
            result += mutability_2_string(wasm, data);
        break;
    }
    return result;
}

function import_params_2_string(params){
    return params.length === 0 ? '' : ` (param ${params.map(e => e.type).join(' ')})`;
}

function params_2_string(params){
    return params.length === 0 ? '' : ` ${params.map((e, i) => "(param $var" + i + ' ' + e.type + ')').join(' ')}`;
}

function results_2_string(results){
    return results.length === 0 ? '' : `${results.map(e => ` (result ${e.type})`).join(' ')}`;
}

function import_descriptor_2_string(wasm, func){
    return import_params_2_string(func.arguments.types) + results_2_string(func.result.types);
}

function descriptor_2_string(wasm, func){
    return params_2_string(func.pipe.arguments.types) + results_2_string(func.pipe.result.types);
}

function import_2_string(data){
    return ` (import "${data.module}" "${data.name}")`;
}

function export_2_string(data){
    return ` (export "${data.name}")`;
}


/*function global_section_2_string(wasm, t = SEPARATOR){
    return wasm.globals.length === 0 ? '' : (wasm.globals.map((data, i) => {
        return SEPARATOR + "(global" + mutability_2_string(wasm, data.type, i) + " (" + expresion_2_string(wasm, { locals: [], body: data.init }, '') + "))";
    }).join('\n') + '\n');
}*/

function import_section_2_string(wasm, subsection, t = SEPARATOR){
    return subsection.length === 0 ? '' : (subsection.map((data, i) => {
        let result = t + "(";
        switch(data.type.type){
            case "memtype":
                result += "memory" + function_2_string(data) + " (;" + i + ";)" + import_2_string(data) + limits_2_string(data.type.limits);
            break;
            case "tabletype":
                result += "table" + function_2_string(data) + " (;" + i + ";)" + import_2_string(data) + limits_2_string(data.type.limits) + " anyfunc";
            break;
            case "globaltype":
                result += "global"+ function_2_string(data) + " (;" + i + ";)" + import_2_string(data) + ' ' + data.type.valtype.type;
            break;
        }
        result += ')';
        return result;
    }).join("\n") + '\n');
}

function element_section_2_string(wasm, t = SEPARATOR){
    return wasm.elements.length === 0 ? '' : (wasm.elements.map((data, i) => {
        // TODO: Check if these indices have names with that indices
        return SEPARATOR + "(elem $elem" + i + " (" + expresion_2_string(wasm, { locals: [], body: data.offset }, '') + ')' + data.init.map(index => index_2_string(wasm, {}, { index: index })).join('') + ')';
    }).join('\n') + '\n');
}

function export_section_2_string(wasm, subsection, t = SEPARATOR){
    return subsection.length === 0 ? '' : (subsection.map((data, i) => {
        let result = t + '(';
        switch(data.index.type){
            case "tableidx":
                result += "table" + function_2_string(data) + index_2_string(wasm, {}, data);
            break;
            case "memidx":
                result += "memory" + function_2_string(data) + " (;" + i + ";)" + export_2_string(data);
            break;
            case "globalidx":
                result += "global" + function_2_string(data) + " (;" + i + ";)" + export_2_string(data) + index_2_string(wasm, {}, Object.assign({ i: i }, data));
            break;
        }
        result += ')';
        return result;
    }).join("\n") + '\n');
}

function function_section_2_string(wasm, functions, t = SEPARATOR){
    return functions.length === 0 ? '' : (functions.map((func, i) => {
        let result = t + "(func" + function_2_string(func);
        switch(func.type){
            case "import":
                result += " (;" + i + ";)" + import_2_string(func);
                result += import_descriptor_2_string(wasm, func.pipe);
            break;
            case "function":
                result += descriptor_2_string(wasm, func);
                result += '\n';// + index_2_string(wasm, {}, data);
                if(func.code === undefined){
                    result += (t + SEPARATOR) + "Error Trying to compile" + '\n';
                }else{
                    result += locals_2_string(wasm, func, t + SEPARATOR);
                    result += body_2_string(wasm, func.code.code, t + SEPARATOR) + '\n';
                    result += SEPARATOR;
                }
            break;
            case "export":
                result += " (;" + (wasm.functions.import.length + i) + ";)" + export_2_string(func);
                result += descriptor_2_string(wasm, func) + '\n';
                if(func.code === undefined){
                    result += (t + SEPARATOR) + "Error Trying to compile" + '\n';
                }else{
                    result += locals_2_string(wasm, func, t + SEPARATOR);
                    result += body_2_string(wasm, func.code.code, t + SEPARATOR) + '\n';
                    result += SEPARATOR;
                }
            break;
        }
        result += ')';
        return result;
    }).join('\n') + '\n');
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

    // Export
    const exports = (wasm.find(e => e.name === "export") || { value: [] }).value;
    const exports_indexes = exports.filter(e => e.index.type === "funcidx");

    // Globals
    const globals = (wasm.find(e => e.name === "global") || { value: [] }).value;

    // Elements
    const elements = (wasm.find(e => e.name === "elem") || { value: [] }).value;
    
    // Elements
    const tables = (wasm.find(e => e.name === "table") || { value: [] }).value;

    // Types
    const types = (wasm.find(e => e.name === "type") || { value: [] }).value;

    const functions_export_body = (wasm.find(e => e.name === "code") || { value: [] }).value;

    const functions_code = imports_indexes.map(func => {
        return {
            module: func.module,
            name: func.name,
            pipe: global_index_2_element(wasm, func.index),
            type: "import"
        }
    }).concat(
        (wasm.find(e => e.name === "func") || { value: [] }).value.map((index, i) => {
            return {
                name: "func" + (i + imports_indexes.length),
                pipe: global_index_2_element(wasm, index),
                code: functions_export_body[i],
                type: "function"
            };
        })
    );

    // Assign Export
    exports_indexes.forEach(export_function => Object.assign(functions_code[export_function.index.i], { name: export_function.name, type: "export" }));

    return {
        data: wasm,
        tables: tables,
        globals: globals,
        elements: elements,
        types: types,
        imports: {
            data: imports,
            memtype: imports.filter(e => e.hasOwnProperty("type") && e.type.type === "memtype"),
            tabletype: imports.filter(e => e.hasOwnProperty("type") && e.type.type === "tabletype"),
            globaltype: imports.filter(e => e.hasOwnProperty("type") && e.type.type === "globaltype"),
        },
        exports: {
            data: exports,
            memidx: exports.filter(e => e.index.type === "memidx"),
            globalidx: exports.filter(e => e.index.type === "globalidx"),
        },
        functions: {
            data: functions_code,
            import: functions_code.filter(e => e.type === "import"),
            functions: functions_code.filter(e => e.type === "functions"),
            export: functions_code.filter(e => e.type === "export"),
        }
    };
}

function wasm_2_string(wasm){
    const parsed_wasm = parse_wasm(wasm);

    return '(module\n'+
        import_section_2_string(parsed_wasm, [
            ...parsed_wasm.imports.memtype,
            ...parsed_wasm.imports.tabletype,
            ...parsed_wasm.imports.globaltype,
        ])+
        function_section_2_string(parsed_wasm, 
            parsed_wasm.functions.data.filter(e => e.type === "import")
        )+
        //global_section_2_string(parsed_wasm)+
        element_section_2_string(parsed_wasm)+
        //data_section_2_string(parsed_wasm)+'\n'+
        export_section_2_string(parsed_wasm, [
            ...parsed_wasm.exports.memidx,
            ...parsed_wasm.exports.globalidx
        ])+
        function_section_2_string(parsed_wasm,
            parsed_wasm.functions.data.filter(e => e.type !== "import")
        )+
    ')';

}


module.exports = { wasm_2_string };