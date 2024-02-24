import { MathUtils } from './MathUtils';

export class BackgroundGenerator {
    private randomColor(): string {
        const a = 0.05, b = 0.125;
        const x = Math.round(255 * MathUtils.mix(a, b, Math.random()));
        return `rgb(${ x },${ x },${ x })`;
    }

    public generate(): string {
        const width = 1920, height = 1080;
        const grid = 120;

        let result = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" `
            + `width="${ width }px" height="${ height }px" viewBox="0 0 ${ width } ${ height }">`;

        const polygon = (x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) => {
            const color = this.randomColor();
            return `<polygon points="${ x0 },${ y0 } ${ x1 },${ y1 } ${ x2 },${ y2 }" `
                + `fill="${ color }" stroke="${ color }" stroke-width="2"/>`;
        };

        for (let y0 = 0; y0 < height; y0 += grid) {
            const y1 = y0 + grid;
            for (let x0 = 0; x0 < width; x0 += grid) {
                const x1 = x0 + grid;
                if (Math.random() < 0.39) {
                    result += polygon(x0, y0, x1, y0, x1, y1);
                    result += polygon(x0, y0, x0, y1, x1, y1);
                } else {
                    result += polygon(x0, y0, x1, y0, x0, y1);
                    result += polygon(x1, y0, x0, y1, x1, y1);
                }
            }
        }

        result += '</svg>';

        return result;
    }
}
