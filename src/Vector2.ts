export class Vector2 {
    x: number;
    y: number;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    getLength() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}
