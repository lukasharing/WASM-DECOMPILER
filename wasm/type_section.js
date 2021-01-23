const { functype } = require("./types");
const { vec } = require("./globals");

function typesec(data, i){
    let pointer = i;
    
    let section = vec(data, pointer, functype);
    pointer += section.bytes;

    return {
        value: section.value,
        bytes: pointer - i
    };
}

module.exports = { typesec };