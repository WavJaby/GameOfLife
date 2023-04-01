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

Color.prototype.toString = function() {
    return 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
}