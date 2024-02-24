export class MathUtils {
    static readonly HALF_PI = 0.5 * Math.PI;

    static mix(a: number, b: number, x: number) {
        return a + (b - a) * x;
    }
}
