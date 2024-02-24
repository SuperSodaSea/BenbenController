import * as PIXI from 'pixi.js';


export class Button extends PIXI.Container {
    private readonly touchArea: PIXI.Container;

    private pointerID: number | null = null;

    public onTriggered?: () => void;

    constructor(touchArea: PIXI.Container) {
        super();

        this.touchArea = touchArea;

        this.touchArea.on('pointerdown', e => {
            if (e.button !== 0) return;
            if (this.getBounds().containsPoint(e.globalX, e.globalY))
                this.pointerID = e.pointerId;
        });
        this.touchArea.on('pointerup', e => {
            if (e.button !== 0) return;
            if (e.pointerId !== this.pointerID) return;
            this.pointerID = null;
            if (this.getBounds().containsPoint(e.globalX, e.globalY))
                this.onTriggered?.();
        });
        this.touchArea.on('mouseleave', e => {
            if (e.pointerId === this.pointerID)
                this.pointerID = null;
        });
    }
}
