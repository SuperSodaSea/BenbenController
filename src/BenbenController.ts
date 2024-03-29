import * as PIXI from 'pixi.js';
import 'pixi.js/unsafe-eval';

import { BackgroundGenerator } from './BackgroundGenerator';
import { BenbenControllerBLE, BenbenControllerBLEConnectionState } from './BenbenControllerBLE';
import { Button } from './Button';
import { MathUtils } from './MathUtils';
import { Stick } from './Stick';
import { Vector2 } from './Vector2';

import antonioBoldWOFF2 from '@fontsource/antonio/files/antonio-latin-700-normal.woff2';
import bluetoothSVG from './assets/images/Bluetooth.svg';
import fullScreenSVG from './assets/images/FullScreen.svg';
import './assets/styles/index.css';


export class BenbenController {
    constructor() {
        this.init();
    }

    async init() {
        const backgroundGenerator = new BackgroundGenerator();
        const controller = new BenbenControllerBLE();

        const appDiv = document.querySelector<HTMLDivElement>('#app');
        if (!appDiv) throw new Error('#app not found');

        const app = new PIXI.Application();
        await app.init({
            antialias: true,
            autoDensity: true,
            autoStart: false,
            backgroundAlpha: 0,
            hello: true,
            resizeTo: appDiv,
            resolution: window.devicePixelRatio,
        });
        appDiv.appendChild(app.canvas);

        appDiv.style.background
            = `url('data:image/svg+xml;base64,${ btoa(backgroundGenerator.generate()) }') center / contain`;


        const textures = await PIXI.Assets.load<PIXI.Texture>([bluetoothSVG, fullScreenSVG]);

        const antonioBold = await PIXI.Assets.load<FontFace>({
            src: antonioBoldWOFF2, data: { family: 'Antonio-Bold', display: 'swap' },
        });


        const titleText = new PIXI.Text({
            text: 'DYNAMIC OMNITERRAIN GUARDIAN SYSTEM | D-307A',
            style: {
                fontFamily: antonioBold.family,
                fill: '#FFFFFF',
            }
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
        const connectButtonText = new PIXI.Text({
            text: '',
            style: {
                fontFamily: antonioBold.family,
                fill: '#FFFFFF',
            },
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

        function updateLayout() {
            const resolution = window.devicePixelRatio;
            app.renderer.resolution = resolution;

            const targetWidth = 1920, targetHeight = 1080;
            const { width: viewWidth, height: viewHeight } = app.canvas;
            let width, height;
            if (viewWidth >= viewHeight) {
                app.stage.rotation = 0;
                width = viewWidth;
                height = viewHeight;
            } else {
                app.stage.rotation = MathUtils.HALF_PI;
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
        }


        const keyState: Record<string, boolean> = {};
        window.addEventListener('keydown', e => {
            keyState[e.key] = true;
        });
        window.addEventListener('keyup', e => {
            keyState[e.key] = false;
        });

        type Inputs = {
            l: Vector2;
            r: Vector2;
        };

        function getTouchInputs(): Inputs {
            const l = leftStick.getInputValue();
            const r = rightStick.getInputValue();
            return { l, r };
        }

        function getKeyboardInputs(): Inputs {
            const l = new Vector2(), r = new Vector2();
            if (keyState['a']) l.x -= 1;
            if (keyState['d']) l.x += 1;
            if (keyState['w']) l.y -= 1;
            if (keyState['s']) l.y += 1;
            if (keyState['ArrowLeft']) r.x -= 1;
            if (keyState['ArrowRight']) r.x += 1;
            if (keyState['ArrowUp']) r.y -= 1;
            if (keyState['ArrowDown']) r.y += 1;
            return { l, r };
        }

        function getGamepadInputs(): Inputs {
            const gamepads = navigator.getGamepads();
            for (const gamepad of gamepads) {
                if (!gamepad)
                    continue;
                const [lx, ly, rx, ry] = gamepad.axes;
                return { l: new Vector2(lx, ly), r: new Vector2(rx, ry) };
            }
            return { l: new Vector2(), r: new Vector2() };
        }

        function selectInputs(inputsList: Inputs[]): Inputs {
            let l = new Vector2(), r = new Vector2();
            let ll = 0, rl = 0;
            for (const { l: nl, r: nr } of inputsList) {
                const nll = nl.getLength();
                if(nll > ll) {
                    l = nl;
                    ll = nll;
                }
                const nrl = nr.getLength();
                if(nrl > rl) {
                    r = nr;
                    rl = nrl;
                }
            }
            return { l, r };
        }

        const deadzone = 0.2;
        const maxSpeed = 1;

        function calculateMotorValues(input: Inputs) {
            const { l, r } = input;

            const ll = l.getLength();
            const movementSpeed = Math.max(ll - deadzone, 0) / (1 - deadzone) * maxSpeed;
            let a = 0, b = 0, c = 0, d = 0;
            if(movementSpeed > 0) {
                const vx = l.x / ll;
                const vy = -l.y / ll;
                const angle = Math.atan2(vy, vx);
                const HALF_PI = MathUtils.HALF_PI;
                if (angle <= -HALF_PI) {
                    const v = (angle + Math.PI) / HALF_PI;
                    a = c = -2 * v + 1;
                    b = d = -1;
                } else if (angle <= 0) {
                    const v = (angle + HALF_PI) / (HALF_PI);
                    b = d = 2 * v - 1;
                    a = c = -1;
                } else if (angle <= HALF_PI) {
                    const v = angle / (HALF_PI);
                    a = c = 2 * v - 1;
                    b = d = 1;
                } else {
                    const v = (angle - HALF_PI) / (HALF_PI);
                    b = d = -2 * v + 1;
                    a = c = 1;
                }
            }
            const movement = [a * movementSpeed, b * movementSpeed, c * movementSpeed, d * movementSpeed];

            const rotationDirection = Math.sign(r.x);
            const rotationSpeed = Math.max(Math.abs(r.x) - deadzone, 0) / (1 - deadzone) * maxSpeed;
            const rotation = [-rotationDirection, rotationDirection, rotationDirection, -rotationDirection];

            const result = [];
            for(let i = 0; i < 4; ++i)
                result[i] = MathUtils.mix(movement[i], rotation[i], rotationSpeed);
            return result;
        }

        function updateInput() {
            const input = selectInputs([
                getTouchInputs(),
                getKeyboardInputs(),
                getGamepadInputs(),
            ]);
            leftStick.setOutputValue(input.l);
            rightStick.setOutputValue(input.r);

            const motorValues = calculateMotorValues(input);
            controller.setMotorValues(motorValues);
        }


        app.ticker.add(() => {
            updateLayout();
            updateInput();
        });

        app.start();
    }
}
