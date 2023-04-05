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
}

Color.prototype.toString = function () {
    return '#' + ((this.r << 16) | (this.g << 8) | this.b).toString(16).padStart(6, '0');
}