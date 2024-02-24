import * as PIXI from 'pixi.js';

import { Vector2 } from './Vector2';


const STICK_AREA_SIZE = 160;

export class Stick extends PIXI.Container {
    private touchArea: PIXI.Container;

    private border: PIXI.Graphics;
    private stick: PIXI.Graphics;
    private stickArea: PIXI.Sprite;

    private pointerID: number | null = null;

    private readonly value = new Vector2();

    constructor(touchArea: PIXI.Container) {
        super();

        this.touchArea = touchArea;

        this.border = new PIXI.Graphics()
            .moveTo(240 * Math.cos(-0.725 * Math.PI), 240 * Math.sin(-0.725 * Math.PI))
            .arc(0, 0, 240, -0.725 * Math.PI, -0.275 * Math.PI, false)
            .moveTo(240 * Math.cos(-0.225 * Math.PI), 240 * Math.sin(-0.225 * Math.PI))
            .arc(0, 0, 240, -0.225 * Math.PI, 0.225 * Math.PI, false)
            .moveTo(240 * Math.cos(0.275 * Math.PI), 240 * Math.sin(0.275 * Math.PI))
            .arc(0, 0, 240, 0.275 * Math.PI, 0.725 * Math.PI, false)
            .moveTo(240 * Math.cos(0.775 * Math.PI), 240 * Math.sin(0.775 * Math.PI))
            .arc(0, 0, 240, 0.775 * Math.PI, -0.775 * Math.PI, false)
            .stroke({ width: 16, color: '#F8F8F8' })
            .poly([-15, -200, 15, -200, 0, -215])
            .poly([200, -15, 200, 15, 215, 0])
            .poly([-15, 200, 15, 200, 0, 215])
            .poly([-200, -15, -200, 15, -215, 0])
            .fill('#EEEEEE')
            .circle(0, 0, 170)
            .fill('#FFFFFF60')
            .stroke({ width: 16, color: '#FFFFFF40', alignment: 0 });
        this.addChild(this.border);

        this.stick = new PIXI.Graphics()
            .circle(0, 0, 50)
            .fill('#FFFFFF60')
            .stroke({ width: 10, color: '#FFFFFF40', alignment: 0 });
        this.addChild(this.stick);

        this.stickArea = new PIXI.Sprite();
        this.stickArea.anchor.set(0.5);
        this.stickArea.width = STICK_AREA_SIZE;
        this.stickArea.height = STICK_AREA_SIZE;
        this.addChild(this.stickArea);

        this.touchArea.on('pointerdown', e => {
            if (e.button !== 0) return;
            const p = e.getLocalPosition(this.stickArea);
            const length = Math.sqrt(p.x * p.x + p.y * p.y);
            if (length <= 2) {
                this.pointerID = e.pointerId;
                const scale = length > 1 ? 1 / length : 1;
                this.value.x = scale * p.x;
                this.value.y = scale * p.y;
            }
        });
        this.touchArea.on('pointerup', e => {
            if (e.button !== 0) return;
            if (e.pointerId === this.pointerID) {
                this.pointerID = null;
                this.value.x = 0;
                this.value.y = 0;
            }
        });
        this.touchArea.on('mouseleave', e => {
            if (e.pointerId === this.pointerID) {
                this.pointerID = null;
                this.value.x = 0;
                this.value.y = 0;
            }
        });
        this.touchArea.on('pointermove', e => {
            if (e.pointerId === this.pointerID) {
                const p = e.getLocalPosition(this.stickArea);
                const length = Math.sqrt(p.x * p.x + p.y * p.y);
                const scale = length > 1 ? 1 / length : 1;
                this.value.x = scale * p.x;
                this.value.y = scale * p.y;
            }
        });
    }

    public getInputValue() {
        return this.value;
    }

    public setOutputValue(value: Vector2) {
        const { x, y } = value;
        const length = value.getLength();
        const scale = length > 1 ? 1 / length : 1;
        this.stick.position.set(scale * x * STICK_AREA_SIZE, scale * y * STICK_AREA_SIZE);
    }
};
