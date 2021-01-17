
module.exports = {
    toStringHex: (t, k = 1) => `\\${t.toString(16).toUpperCase().padStart(k, '0')}`,
    toHex: (t, k = 1) => `0x${t.toString(16).toUpperCase().padStart(k, '0')}`
};