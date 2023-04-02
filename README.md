# Benben Controller

![Benben Controller](./docs/BenbenController.jpg)

[![GitHub Stars](https://img.shields.io/github/stars/SuperSodaSea/BenbenController.svg?style=social)](https://github.com/SuperSodaSea/BenbenController/stargazers)
[![GitHub License](https://img.shields.io/github/license/SuperSodaSea/BenbenController)](https://github.com/SuperSodaSea/BenbenController/blob/main/LICENSE)

> _……**DOG（多功能全地形智能运输平台）** 集群启动完毕。恢复建材打印。_
>
> _...**DOG (Dynamic Omniterrain Guardian)** Cluster activated. Printing of construction materials resumed._

**[笨笨智能积木](https://detail.tmall.com/item.htm?id=695629474439)** 是 **商汤 | 羊很大** 联合 **电影《流浪地球2》** 推出的一款智能积木，对电影中出现的笨笨机器人进行了 1:2.5 等比复刻，可通过蓝牙连接进行无线操控。

**Benben Controller** 是笨笨智能积木的**非官方版本**控制器，让你无需下载 APP，直接在浏览器中操控你的笨笨机器人。

**[点我在线体验！](https://supersodasea.github.io/BenbenController/)**

## 浏览器支持

使用支持 Web Bluetooth API 的浏览器即可运行 Benben Controller，例如 Chrome 和 Edge。
由于安全因素考虑，Firefox 和 Safari 暂时没有支持 Web Bluetooth API 的计划，所以无法使用 Benben Controller，敬请谅解。

你可以访问下列链接查看不同浏览器对 Web Bluetooth API 的支持情况：

- <https://caniuse.com/web-bluetooth>
- <https://github.com/WebBluetoothCG/web-bluetooth/blob/main/implementation-status.md>

## 操作方式

点击屏幕下方的蓝牙图标，在弹出的设备选择列表中，选择名为“YX_000000(BLE)”的设备进行配对。
搜索设备可能需要数秒时间，请耐心等待。

<img src="./docs/PairingBluetoothDevice.png" width="450">

选择设备后，蓝牙图标下方文字显示为“Connected”时即为连接成功。

Benben Controller 支持三种操作方式：

- 触摸：触摸屏幕上的虚拟摇杆进行操作，如果在电脑端也可使用鼠标拖动虚拟摇杆进行操作。
- 键盘：使用键盘的 WASD 操作左摇杆，方向键操作右摇杆。
- 手柄：使用手柄的左摇杆和右摇杆进行操作。
    - 已测试 Xbox Wireless Controller、Joy-Con L+R 可用。

左摇杆可以控制笨笨的前后左右移动，右摇杆可以控制笨笨原地旋转。

## 本地调试

```bash
# 如果没有用过 pnpm 的话，需要先安装 pnpm
npm i -g pnpm

pnpm i
pnpm dev
```

随后即可访问 <http://localhost:5173/> 进行测试。
如果你在本地需要通过局域网使用其他设备进行调试，由于 Web Bluetooth API 的限制，你需要使用 `pnpm dev:https` 启动 HTTPS 调试服务器。
首次访问时会提示连接不安全，忽略即可。

## 传输协议

笨笨机器人的控制器使用低功耗蓝牙（BLE）GATT 协议进行信息传输。

- 搜索设备所用 Service UUID: `0xAF30`
- 数据传输所用 Service UUID: `0xAF3A`
- Characteristic UUID: `0xAF3B`

数据包大小为 18 字节，格式如下：

| 字节  | 描述 |
|:-----:|------|
| 0     | 固定为 0xCC。 |
| 1\~2  | 官方控制器在首次启动时会随机生成并保存一个 16 位整数作为此字段的值，实际设为任意值均可正常工作。 |
| 3\~6  | 四个电机（A、B、C、D）的转速值。值为 0 或 128 为停转，为 1\~127 为逆向旋转（为 1 时速度最大），为 129\~255 时为正向旋转（为 255 时速度最大）。需注意的是电机 D 的取值与其它电机相反（1 为正向，255 为逆向）。 |
| 7\~15 | 可为任意值。 |
| 16    | 校验和，值为 1\~15 字节之和模 256 的结果。 |
| 17    | 固定为 0x33。 |

## 特别感谢

- **[PixiJS](https://github.com/pixijs/pixijs)**: Benben Controller 的界面使用 PixiJS 进行绘制。
- **[The Wandering Earth 2 Countdown](https://github.com/Rominwolf/the-wandering-earth-2-countdown-meme-generator.github.io)**: 题图中倒计时所使用的生成器。
