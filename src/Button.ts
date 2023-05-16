import * as PIXI from './PixiJS';


export class Button extends PIXI.Container {
    private readonly touchArea: PIXI.DisplayObject;
    
    private pointerID: number | null = null;
    
    public onTriggered?: () => void;
    
    constructor(touchArea: PIXI.DisplayObject) {
        super();
        
        this.touchArea = touchArea;
        
        this.touchArea.on('pointerdown', e => {
            if (e.button !== 0) return;
            if (this.getBounds().contains(e.globalX, e.globalY))
                this.pointerID = e.pointerId;
        });
        this.touchArea.on('pointerup', e => {
            if (e.button !== 0) return;
            if (e.pointerId !== this.pointerID) return;
            this.pointerID = null;
            if (this.getBounds().contains(e.globalX, e.globalY))
                this.onTriggered?.();
        });
        this.touchArea.on('mouseleave', e => {
            if (e.pointerId === this.pointerID)
                this.pointerID = null;
        });
    }
}
