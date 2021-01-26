
const fs = require('fs');

const { decompile, wasm_section_information } = require("./decompiler"); 
const { wasm_2_string } = require("./wasm_2_string");

//const name = "h2020";
//const wasm_buffer = fs.readFileSync(name);
const name = "./examples/code-2";
const wasm_buffer = Buffer.from(fs.readFileSync(name, "ascii"), "base64");

const wasm = decompile(wasm_buffer);

//console.log(wasm_section_information(wasm));

const wasm_string = wasm_2_string(wasm);
//console.log(wasm_string);

//fs.writeFileSync(`${name}-decompiled.wasm`, wasm_string);
