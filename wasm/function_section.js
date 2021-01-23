const { typeidx } = require("./indices");
const { vec } = require("./globals");

function funcsec(data, i){
    let pointer = i;
    
    let section = vec(data, pointer, typeidx);
    pointer += section.bytes;

    return {
        value: section.value,
        bytes: pointer - i
    };
}

module.exports = {funcsec };