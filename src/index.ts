import { BackgroundGenerator } from './BackgroundGenerator';
import { BenbenControllerBLE, BenbenControllerBLEConnectionState } from './BenbenControllerBLE';
import { Button } from './Button';
import * as PIXI from './PixiJS';
import { Stick } from './Stick';

import antonioBoldWOFF2 from '@fontsource/antonio/files/antonio-latin-700-normal.woff2';
import bluetoothSVG from './assets/images/Bluetooth.svg';
import fullScreenSVG from './assets/images/FullScreen.svg';
import './assets/styles/index.css';


const backgroundGenerator = new BackgroundGenerator();
const controller = new BenbenControllerBLE();

const appDiv = document.querySelector<HTMLDivElement>('#app');
if (!appDiv) throw new Error('#app not found');

const app = new PIXI.Application<HTMLCanvasElement>({
    antialias: true,
    autoDensity: true,
    autoStart: false,
    backgroundAlpha: 0,
    hello: true,
    resizeTo: appDiv,
    resolution: devicePixelRatio,
});
appDiv.appendChild(app.view);

appDiv.style.background
    = `url('data:image/svg+xml;base64,${ btoa(backgroundGenerator.generate()) }') center / contain`;


const textures = await PIXI.Assets.load<PIXI.Texture>([bluetoothSVG, fullScreenSVG]);

const antonioBold = await PIXI.Assets.load<FontFace>({
    src: antonioBoldWOFF2, data: { family: 'Antonio-Bold', display: 'swap' },
});


const titleText = new PIXI.Text('DYNAMIC OMNITERRAIN GUARDIAN SYSTEM | D-307A', {
    fontFamily: antonioBold.family,
    fill: '#FFFFFF',
});
titleText.anchor.set(0.5);
titleText.position.set(0, -400);
app.stage.addChild(titleText);

const touchArea = new PIXI.Sprite();
touchArea.anchor.set(0.5);
touchArea.width = 1e6;
touchArea.height = 1e6;
touchArea.eventMode = 'static';

const leftStick = new Stick(touchArea);
leftStick.position.set(-450, 0);
app.stage.addChild(leftStick);

const rightStick = new Stick(touchArea);
rightStick.position.set(450, 0);
app.stage.addChild(rightStick);

const connectButton = new Button(touchArea);
connectButton.position.set(0, 400);
const bluetoothSprite = new PIXI.Sprite(textures[bluetoothSVG]);
bluetoothSprite.anchor.set(0.5);
bluetoothSprite.width = 64;
bluetoothSprite.height = 64;
bluetoothSprite.position.set(0, -36);
connectButton.addChild(bluetoothSprite);
const connectButtonText = new PIXI.Text('', {
    fontFamily: antonioBold.family,
    fill: '#FFFFFF',
});
connectButtonText.anchor.set(0.5);
connectButtonText.position.set(0, 36);
connectButton.addChild(connectButtonText);
connectButton.onTriggered = async () => {
    if (controller.getConnectionState() !== BenbenControllerBLEConnectionState.DISCONNECTED) return;
    try {
        await controller.connect();
    } catch (e) {
        console.error(e);
        alert(`Connect failed:\n${ e }`);
    }
};
app.stage.addChild(connectButton);

const fullscreenButton = new Button(touchArea);
fullscreenButton.position.set(850, 420);
const fullscreenButtonSprite = new PIXI.Sprite(textures[fullScreenSVG]);
fullscreenButtonSprite.anchor.set(0.5);
fullscreenButtonSprite.width = 80;
fullscreenButtonSprite.height = 80;
fullscreenButton.addChild(fullscreenButtonSprite);
fullscreenButton.onTriggered = () => {
    if (!document.fullscreenElement)
        appDiv.requestFullscreen({ navigationUI: 'hide' });
    else
        document.exitFullscreen();
};
app.stage.addChild(fullscreenButton);

app.stage.addChild(touchArea);


app.ticker.add(() => {
    const resolution = window.devicePixelRatio;
    app.renderer.resolution = resolution;
    
    const targetWidth = 1920, targetHeight = 1080;
    const { width: viewWidth, height: viewHeight } = app.view;
    let width, height;
    if (viewWidth >= viewHeight) {
        app.stage.rotation = 0;
        width = viewWidth;
        height = viewHeight;
    } else {
        app.stage.rotation = 0.5 * Math.PI;
        width = viewHeight;
        height = viewWidth;
    }
    
    const scale = Math.min(width / targetWidth, height / targetHeight) / resolution;
    app.stage.x = viewWidth / resolution / 2;
    app.stage.y = viewHeight / resolution / 2;
    app.stage.scale.set(scale);
    
    titleText.style.fontSize = 80 * scale;
    titleText.scale.set(1 / scale);
    
    switch (controller.getConnectionState()) {
    case BenbenControllerBLEConnectionState.DISCONNECTED: {
        connectButtonText.text = 'Disconnected';
        break;
    }
    case BenbenControllerBLEConnectionState.CONNECTING: {
        connectButtonText.text = 'Connecting...';
        break;
    }
    case BenbenControllerBLEConnectionState.CONNECTED: {
        connectButtonText.text = 'Connected';
        break;
    }
    }
    connectButtonText.style.fontSize = 50 * scale;
    connectButtonText.scale.set(1 / scale);
});


const keyState: Record<string, boolean> = {};
window.addEventListener('keydown', e => {
    keyState[e.key] = true;
});
window.addEventListener('keyup', e => {
    keyState[e.key] = false;
});

type Inputs = {
    lx: number;
    ly: number;
    rx: number;
    ry: number;
};

function getTouchInputs(): Inputs {
    const { x: lx, y: ly } = leftStick.getInputValue();
    const { x: rx, y: ry } = rightStick.getInputValue();
    return { lx, ly, rx, ry };
}

function getKeyboardInputs(): Inputs {
    let lx = 0, ly = 0, rx = 0, ry = 0;
    if (keyState['a']) lx -= 1;
    if (keyState['d']) lx += 1;
    if (keyState['w']) ly -= 1;
    if (keyState['s']) ly += 1;
    if (keyState['ArrowLeft']) rx -= 1;
    if (keyState['ArrowRight']) rx += 1;
    if (keyState['ArrowUp']) ry -= 1;
    if (keyState['ArrowDown']) ry += 1;
    return { lx, ly, rx, ry };
}

function getGamepadInputs(): Inputs {
    const gamepads = navigator.getGamepads();
    for (let gamepad of gamepads) {
        if (!gamepad)
            continue;
        const [lx, ly, rx, ry] = gamepad.axes;
        return { lx, ly, rx, ry };
    }
    return { lx: 0, ly: 0, rx: 0, ry: 0 };
}

function selectInputs(inputsList: Inputs[]): Inputs {
    let lx = 0, ly = 0, rx = 0, ry = 0;
    let lv = 0, rv = 0;
    for (const { lx: nlx, ly: nly, rx: nrx, ry: nry } of inputsList) {
        const nlv = Math.sqrt(nlx * nlx + nly * nly);
        if(nlv > lv) {
            lx = nlx;
            ly = nly;
            lv = nlv;
        }
        const nrv = Math.sqrt(nrx * nrx + nry * nry);
        if(nrv > rv) {
            rx = nrx;
            ry = nry;
            rv = nrv;
        }
    }
    return { lx, ly, rx, ry };
}

const deadzone = 0.2;
const maxSpeed = 1;

function calculateMotorValues(input: Inputs) {
    const { lx, ly, rx } = input;
    
    if (Math.abs(rx) >= deadzone) {
        const speed = Math.sign(rx) * (Math.abs(rx) - deadzone) / (1 - deadzone) * maxSpeed;
        return [-speed, speed, speed, -speed];
    } else {
        const l = Math.sqrt(lx * lx + ly * ly);
        if (l <= deadzone)
            return [0, 0, 0, 0];
        else {
            const vx = lx / l;
            const vy = -ly / l;
            const speed = (l - deadzone) / (1 - deadzone) * maxSpeed;
            const angle = Math.atan2(vy, vx);
            let a = 0, b = 0, c = 0, d = 0;
            if (angle <= -0.5 * Math.PI) {
                const v = (angle + Math.PI) / (0.5 * Math.PI);
                a = c = -2 * v + 1;
                b = d = -1;
            } else if (angle <= 0) {
                const v = (angle + 0.5 * Math.PI) / (0.5 * Math.PI);
                b = d = 2 * v - 1;
                a = c = -1;
            } else if (angle <= 0.5 * Math.PI) {
                const v = angle / (0.5 * Math.PI);
                a = c = 2 * v - 1;
                b = d = 1;
            } else {
                const v = (angle - 0.5 * Math.PI) / (0.5 * Math.PI);
                b = d = -2 * v + 1;
                a = c = 1;
            }
            return [a * speed, b * speed, c * speed, d * speed];
        }
    }
}

app.ticker.add(() => {
    const input = selectInputs([
        getTouchInputs(),
        getKeyboardInputs(),
        getGamepadInputs(),
    ]);
    leftStick.setOutputValue(input.lx, input.ly);
    rightStick.setOutputValue(input.rx, input.ry);
    
    const motorValues = calculateMotorValues(input);
    controller.setMotorValues(motorValues[0], motorValues[1], motorValues[2], motorValues[3]);
});


app.start();
