export enum BenbenControllerConnectionState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
};

export class BenbenController {
    private static SERVICE_FILTER_UUID = 0xAF30;
    private static SERVICE_DATA_UUID = 0xAE3A;
    private static CHARACTERISTIC_UUID = 0xAE3B;
    
    private connectionState = BenbenControllerConnectionState.DISCONNECTED;
    private bluetoothCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
    
    private readonly motorValues = new Float32Array(4);
    
    public constructor() {}
    
    public async connect() {
        if (this.connectionState !== BenbenControllerConnectionState.DISCONNECTED)
            throw new Error('BenbenController.connect() can only be called when it is disconnected');
        
        try {
            this.connectionState = BenbenControllerConnectionState.CONNECTING;
            
            const bluetoothDevice = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: [BenbenController.SERVICE_FILTER_UUID] },
                ],
                optionalServices: [BenbenController.SERVICE_DATA_UUID],
            });
            const bluetoothGATTServer = bluetoothDevice.gatt;
            if (!bluetoothGATTServer) throw new Error('BenbenController: device.gatt do not exist');
            await bluetoothGATTServer.connect();
            const bluetoothGATTService
                = await bluetoothGATTServer.getPrimaryService(BenbenController.SERVICE_DATA_UUID);
            const bluetoothGATTCharacteristic
                = await bluetoothGATTService.getCharacteristic(BenbenController.CHARACTERISTIC_UUID);
            
            this.bluetoothCharacteristic = bluetoothGATTCharacteristic;
            
            this.connectionState = BenbenControllerConnectionState.CONNECTED;
            
            this.startSender();
        } catch (e) {
            this.connectionState = BenbenControllerConnectionState.DISCONNECTED;
            throw e;
        }
    }
    
    public getConnectionState() { return this.connectionState; }
    
    public setMotorValues(a: number, b: number, c: number, d: number) {
        this.motorValues.set([a, b, c, d]);
    }
    
    private sleep(t: number) {
        return new Promise(resolve => setTimeout(resolve, t))
    }
    
    private async startSender() {
        const INTERVAL = 50;
        try {
            while (true) {
                const data = this.createPacket();
                const startTime = performance.now();
                await this.bluetoothCharacteristic?.writeValue(data);
                const currentTime = performance.now();
                await this.sleep(Math.max(INTERVAL - (currentTime - startTime), 0));
            }
        } catch (e) {
            console.error(e);
            this.connectionState = BenbenControllerConnectionState.DISCONNECTED;
        }
    }
    
    private convertMotorValue(x: number): number {
        const v = Math.round(127 * x);
        return v < -127 ? 1 : v > 127 ? 255 : 128 + v;
    }
    
    private createPacket(): Uint8Array {
        const data = new Uint8Array([
            0xCC,
            0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x80,
            0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x00,
            0x33,
        ]);
        
        const [a, b, c, d] = this.motorValues;
        
        data[4] = this.convertMotorValue(a);
        data[5] = this.convertMotorValue(b);
        data[6] = this.convertMotorValue(c);
        data[7] = this.convertMotorValue(-d);
        
        let checksum = 0;
        for (let i = 1; i <= 15; ++i)
            checksum += data[i];
        checksum &= 0xFF;
        data[16] = checksum;
        
        return data;
    }
}
