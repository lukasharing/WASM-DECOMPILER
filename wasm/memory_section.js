
function mem(data, i){
    let pointer = i;
    
    const mt = memtype(data, i);
    pointer += mt.bytes;

    return {
        value: { mt: mt.value },
        bytes: pointer - i
    };
}

function memsec(data, i){
    let pointer = i;
    
    let section = vec(data, pointer, mem);
    pointer += section.bytes;

    return {
        value: section.value,
        bytes: pointer - i
    };
}

module.exports = { memsec };