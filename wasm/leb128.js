/**** LEB128 */
module.exports = { 
    leb2int: (data, v, n = 5) => {
        let r = 0, s = 0;
        for(let d = 0; s < n; d = ++s << 3){
            const b = data.readUInt8(v + s);
            r |= (b & 0x7f) << (d - s);
            if ((0x80 & b) === 0x0){
                if ((s + 1) < 4 && (b & 0x40) !== 0x0) {
                    r |= (~0 << (d - (s + 1)));
                }
                break;
            }
        }
        return {value: r, bytes: s + 1};
    },
    leb2uint: (data, v, n = 5) => {
        let r = 0, s = 0;
        for(let d = 0; s < n; d = ++s << 3){
            const b = data.readUInt8(v + s);
            r |= (b & 0x7F) << (d - s);
            if((b & ~0x7F) === 0x0) break;
        }
        return {value: r, bytes: s + 1};
    }
};