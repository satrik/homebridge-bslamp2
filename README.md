# homebridge-bslamp2
Homebridge plugin to control Mi Bedside Lamps 2

<a href="https://www.npmjs.com/package/homebridge-bslamp2"><img title="npm version" src="https://badgen.net/npm/v/homebridge-bslamp2?icon=npm&label"></a>
<a href="https://github.com/satrik/homebridge-bslamp2"><img title="npm downloads total" src="https://badgen.net/badge/color/Repo/green?icon=github&label"></a>

## Install

```
sudo npm install -g homebridge-bslamp2
```
## Requirements
- the Lamps needs a static IP.
- you need the homekit pairing code from the lamp

## Configuration
With the plugin comes a CLI tool which can be executed with `bslamp` (see usage at next section).
`sudo` is (mostly) needed as usually the user doesn't have write rights in the modules directory. 
After the pairing it generates a copy-pastable homebridge accessory conig. e.g.:
```
pi@raspberrypi:~ $ sudo bslamp pair 192.168.0.123 098-76-543
Search Device........
Found MiBedsideLamp2-7A5C
Start pairing
MiBedsideLamp2-7A5C successfully paired!

Paste the following into your homebridge config
'name' is what you see in homebridge/homekit and can be changed
===========COPY START===========
{
    "accessory": "MiBedsideLamp2",
    "name": "Mi Bedside Lamp 2",
    "id": "1F:5E:75:AF:D5:06",
    "address": "192.168.0.123",
    "port": 80,
    "pairingData": {
        "AccessoryPairingID": "12312a45645a78978a12312a45645a7890",
        "AccessoryLTPK": "1d3c8db26d21a66d37535a6a7892f5aaa33a8ba86c63ef3456890c253a2636ce",        
        "iOSDevicePairingID": "360342967342985723409587234576139874634206895435678934058123095634759086",
        "iOSDeviceLTSK": "1424f4ed6b24c5b78e2938475b3edc395619433a32ce1252cb4c8856c0faaf4daae82ac6c560de5c365dcba87c4024ebb309896d2d8c267344ff6a52794ae194c",
        "iOSDeviceLTPK": "fae66ac3c263de3c647dcba46c8643ebb245757d3d5c87974ff3a25143ae689c"
    }
}
============COPY END============
```

## Usage bslamp 
```
bslamp help
=================================
Usage pair: bslamp pair [ip address] [pairing code]
 - e.g.  'bslamp pair 192.168.0.123 012-34-567'

Usage unpair: bslamp unpair [filename]
 - [filename] is 'bslamp-' and the IP address of the device with '-' instead of '.'
 - e.g.  'bslamp unpair bslamp-192-168-0-123'
```

## Changelog
## 1.0.4
- close hap-controller client connection after 3 seconds without user input
- create a new client if the current one has problems or no one is available
- improve subscription stability
- better state handling

## 1.0.3
- fix wrong dependency in package.json

## 1.0.2
- updated to newest hap-controller package
- complete rewritten all hap client functions to improve stability

## 1.0.1
- changed scope of the saved states to work with muliple lamps
- switched to promise-based _Characteristic.onSet / .onGet_ methods
