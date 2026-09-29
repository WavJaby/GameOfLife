/**
 * @param r
 * @param g
 * @param b
 * @constructor
 */
function Color(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
    // color never change after construction, prebuild
    this.css = '#' + (((r << 16) | (g << 8) | b) >>> 0).toString(16).padStart(6, '0');
}

Color.prototype.toString = function () {
    return this.css;
}