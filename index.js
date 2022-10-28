"use strict"

let Service, Characteristic

const { HttpClient } = require("hap-controller")
const packageJson = require("./package.json")
const aid = 1
const instanceId = {
    on: 12,
    brightness: 14,
    hue: 15,
    saturation: 16
}
const characteristicOn = aid + "." + instanceId.on
const characteristicBrightness = aid + "." + instanceId.brightness
const characteristicHue = aid + "." + instanceId.hue
const characteristicSaturation = aid + "." + instanceId.saturation
const subscribeAll = [characteristicOn, characteristicBrightness, characteristicHue, characteristicSaturation]


module.exports = function (homebridge) {

    Service = homebridge.hap.Service
    Characteristic = homebridge.hap.Characteristic

    homebridge.registerAccessory("homebridge-bslamp2", "MiBedsideLamp2", MiBedsideLamp2)

}


function getKeyByValue(object, value) {

    return Object.keys(object).find(key => object[key] === value)

}


function capitalizeFirstLetter(string) {

    return string.charAt(0).toUpperCase() + string.slice(1)

}


async function handleSubscription(that) {

    if(that.subClient.listeners('event').length == 0) {

        try {

            await that.subClient.subscribeCharacteristics(subscribeAll)

        } catch (e) {

            that.log.error(e)

        }

    }

    that.subClient.on('event', async (event) => {

        if (that.logUpdates) {

            that.allEvents = event

            that.allEvents.characteristics.forEach(ev => {

                that.typeToUpdate = capitalizeFirstLetter(getKeyByValue(instanceId, ev.iid))
                that.log("recieved update for '" + that.typeToUpdate + "' => " + ev.value)
                that.savedStates[getKeyByValue(instanceId, ev.iid)] = ev.value
                that.service.getCharacteristic(Characteristic[that.typeToUpdate]).updateValue(ev.value)

            })

        }

        that.logUpdates = true

    })

    that.subClient.on('event-disconnect', async (formerSubscribes) => {
        
        try {

            await that.subClient.unsubscribeCharacteristics(subscribeAll)
            
        } catch (e) {

            that.log.error(e)

        }

    })

}


function MiBedsideLamp2(log, config) {

    this.log = log
    this.config = config

    this.id = config.id
    this.address = config.address
    this.pairingData = config.pairingData
    this.port = config.port
    this.name = config.name

    this.manufacturer = packageJson.author
    this.serial = config.id
    this.model = packageJson.displayName
    this.firmware = packageJson.version

    this.service = new Service.Lightbulb(this.name)

    this.savedStates = {
        on: false,
        brightness: 0,
        hue: 0,
        saturation: 0
    }

    this.logUpdates = true
    this.resetTimer = null

    this.subClient = new HttpClient(
        this.id,
        this.address,
        this.port,
        this.pairingData,
        {
            usePersistentConnections: true,
            subscriptionsUseSameConnection: false
        }
    )
    
    handleSubscription(this)

}


MiBedsideLamp2.prototype = {

    handleRequest: async function (set, value, char) {

        if(this.subClient.listeners('event').length == 0) {

            handleSubscription(this)

        }

        this.client = this.client || new HttpClient(
            this.id,
            this.address,
            this.port,
            this.pairingData,
            {
                usePersistentConnections: true,
                subscriptionsUseSameConnection: false
            }
        )

        if (set) {

            try {

                await this.client.setCharacteristics({[char] : value})

            } catch(e) {

                this.log.error(e)

            }

        } else {

            try {

                this.result = await this.client.getCharacteristics([char])
                this.savedStates[getKeyByValue(instanceId, this.result.characteristics[0].iid)] = this.result.characteristics[0].value
                this.typeToUpdate = capitalizeFirstLetter(getKeyByValue(instanceId, this.result.characteristics[0].iid))
                this.service.getCharacteristic(Characteristic[this.typeToUpdate]).updateValue(this.result.characteristics[0].value)

            } catch(e) {

                this.log.error(e)

            }

        }

        this.resetLogTimeout()

    },

    resetLogTimeout: function () {

        if(this.resetTimer != null) {

            clearTimeout(this.resetTimer)
            this.resetTimer = null

        }

        this.resetTimer = setTimeout(() => {

            this.logUpdates = true
            this.resetTimer = null

        }, 1000)

    },

    getOn: function () {

        this.logUpdates = false
        this.handleRequest(false, 0, characteristicOn)
        return this.savedStates.on

    },

    setOn: function (value) {

        this.logUpdates = false
        if(this.savedStates.on != value) {
            this.log("set 'On' to => " + value)
        }
        this.savedStates.on = value
        this.handleRequest(true, value, characteristicOn)

    },

    getBrightness: function () {

        this.logUpdates = false
        this.handleRequest(false, 0, characteristicBrightness)
        return this.savedStates.brightness

    },

    setBrightness: function (value) {

        this.logUpdates = false
        if(this.savedStates.brightness != value) {
            this.log("set 'Brightness' to => " + value)
        }
        this.savedStates.brightness = value
        this.handleRequest(true, value, characteristicBrightness)

    },

    getHue: function () {

        this.logUpdates = false
        this.handleRequest(false, 0, characteristicHue)
        return this.savedStates.hue

    },

    setHue: function (value) {

        this.logUpdates = false
        if(this.savedStates.hue != value) {
            this.log("set 'Hue' to => " + value)
        }
        this.savedStates.hue = value
        this.handleRequest(true, value, characteristicHue)

    },

    getSaturation: function () {

        this.logUpdates = false
        this.handleRequest(false, 0, characteristicSaturation)
        return this.savedStates.saturation

    },

    setSaturation: function (value) {

        this.logUpdates = false
        if(this.savedStates.saturation != value) {
            this.log("set 'Saturation' to => " + value)
        }

        this.savedStates.saturation = value
        this.handleRequest(true, value, characteristicSaturation)

    },

    getServices: function () {

        this.informationService = new Service.AccessoryInformation()

        this.informationService
            .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
            .setCharacteristic(Characteristic.Model, this.model)
            .setCharacteristic(Characteristic.SerialNumber, this.serial)
            .setCharacteristic(Characteristic.FirmwareRevision, this.firmware)

        this.service.getCharacteristic(Characteristic.On)
            .onGet(this.getOn.bind(this))
            .onSet(this.setOn.bind(this))

        this.service.getCharacteristic(Characteristic.Hue)
            .onGet(this.getHue.bind(this))
            .onSet(this.setHue.bind(this))

        this.service.getCharacteristic(Characteristic.Saturation)
            .onGet(this.getSaturation.bind(this))
            .onSet(this.setSaturation.bind(this))

        this.service.getCharacteristic(Characteristic.Brightness)
            .onGet(this.getBrightness.bind(this))
            .onSet(this.setBrightness.bind(this))

        return [this.informationService, this.service]

    }

}
