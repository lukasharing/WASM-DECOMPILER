const { tabletype } = require("./types");
const { vec } = require("./globals");

function table(data, i){
    let pointer = i;

    const tt = tabletype(data, pointer);
    pointer += tt.bytes;

    return {
        value: tt.value,
        bytes: pointer - i
    };
}

function tablesec(data, i){
    let pointer = i;
    
    let section = vec(data, pointer, table);
    pointer += section.bytes;

    return {
        value: section.value,
        bytes: pointer - i
    };
}

module.exports = { tablesec };