
const fs = require('fs');

const { decompile, wasm_section_information } = require("./decompiler"); 
const { wasm_2_string } = require("./wasm_2_string");

//const name = "../h2020";
//const wasm_buffer = fs.readFileSync(name);
//const name = "./examples/code-1";
//const name = "../squoosh";
const name = "../h2020-02-01";
const wasm_buffer = Buffer.from(fs.readFileSync(name, "ascii"), "base64");

const a_c = new Date().getTime();
const wasm = decompile(wasm_buffer);
const b_c = new Date().getTime();
console.log(`Compiled in ${(b_c - a_c) / 1000.0}s`);


console.log(wasm_section_information(wasm));

const a_s = new Date().getTime();
const wasm_string = wasm_2_string(wasm);
const b_s = new Date().getTime();
console.log(`Stringify in ${(b_s - a_s) / 1000.0}s`);

//fs.writeFileSync(`${name}-decompiled.wasm`, wasm_string);