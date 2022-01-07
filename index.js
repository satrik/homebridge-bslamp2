"use strict";

let Service, Characteristic;

const { HttpClient } = require("hap-controller");
const packageJson = require("./package.json");
const aid = 1;
const instanceId = {
    on: 12,
    brightness: 14,
    hue: 15,
    saturation: 16
};
const characteristicOn = aid + "." + instanceId.on;
const characteristicBrightness = aid + "." + instanceId.brightness;
const characteristicHue = aid + "." + instanceId.hue;
const characteristicSaturation = aid + "." + instanceId.saturation;
const subscribeAll =  [characteristicOn, characteristicBrightness, characteristicHue, characteristicSaturation];

let savedStates = {
    on: false,
    brightness: 0,
    hue: 0,
    saturation: 0
};

let logUpdates = true;

module.exports = function (homebridge) {
	
	Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

	homebridge.registerAccessory("homebridge-bslamp2", "MiBedsideLamp2", MiBedsideLamp2);

}

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
  
function MiBedsideLamp2(log, config) {

	this.log = log;
	this.config = config;

	this.id = config.id;
	this.address = config.address;
    this.pairingData = config.pairingData;
    this.port = config.port;
	this.name = config.name;
    
    this.manufacturer = packageJson.author;
    this.serial = config.id;
    this.model = packageJson.displayName;
    this.firmware = packageJson.version;

    this.service = new Service.Lightbulb(this.name);

    const ipClient = new HttpClient(this.id, this.address, this.port, this.pairingData);
    
    ipClient.on('event', (event) => {

        if(logUpdates) {
            
            let allEvents = event;
        
            allEvents.characteristics.forEach(ev => {
    
                let typeToUpdate = capitalizeFirstLetter(getKeyByValue(instanceId, ev.iid));
                this.log("recieved update for '" + typeToUpdate + "' => " + ev.value)
                savedStates[getKeyByValue(instanceId, ev.iid)] = ev.value;
                this.service.getCharacteristic(Characteristic[typeToUpdate]).updateValue(ev.value);

            })

        }


    });

    let connection;

    ipClient.on('event-disconnect', (subscribedList) => {
        
        ipClient.unsubscribeCharacteristics(subscribedList, connection).then(() => {
            connection = undefined;
        }).catch((e) => console.error(e));

        ipClient.subscribeCharacteristics(subscribeAll).then((conn) => {
            connection = conn;
        }).catch((e) => console.error(e));

    });

    ipClient.subscribeCharacteristics(subscribeAll).then((conn) => {
        connection = conn;
    }).catch((e) => console.error(e));

}

MiBedsideLamp2.prototype = {

    handleRequest: function (set, value, char) {        

        if(set) {

            const setClient = new HttpClient(this.id, this.address, this.port, this.pairingData)
            setClient.setCharacteristics({[char]: value})
            .then(() => {})
            .catch((e) => this.log(e));
        
        } else {

            const getClient = new HttpClient(this.id, this.address, this.port, this.pairingData)
            getClient.getCharacteristics([char],{})
            .then((result) => {

                if(savedStates[getKeyByValue(instanceId, result.characteristics[0].iid)] != result.characteristics[0].value) {
                
                    savedStates[getKeyByValue(instanceId, result.characteristics[0].iid)] = result.characteristics[0].value;
                    let typeToUpdate = capitalizeFirstLetter(getKeyByValue(instanceId, result.characteristics[0].iid));
                    this.service.getCharacteristic(Characteristic[typeToUpdate]).updateValue(result.characteristics[0].value);
                
                }

            })
            .catch((e) => this.log(e));
        
        }

        setTimeout(() => {
            logUpdates = true;
        }, 1000);

    },

    getOn: function (callback) {

        logUpdates = false;
        callback(null, savedStates.on);
        this.handleRequest(false, 0, characteristicOn);
    
    },

    setOn: function (value, callback) {

        logUpdates = false;
        savedStates.on = value;
        this.handleRequest(true, value, characteristicOn);
        this.log("set 'On' to => " + value);
        callback();

    },

    getBrightness: function (callback) {

        logUpdates = false;
        callback(null, savedStates.brightness);
        this.handleRequest(false, 0, characteristicBrightness);
    
    },
  
    setBrightness: function (value, callback) {

        logUpdates = false;
        savedStates.brightness = value;
        this.handleRequest(true, value, characteristicBrightness);
        this.log("set 'Brightness' to => " + value);
        callback();

    },
    
    getHue: function (callback) {

        logUpdates = false;
        callback(null, savedStates.hue);
        this.handleRequest(false, 0, characteristicHue);
    
    },
    
    setHue: function (value, callback) {

        logUpdates = false;
        savedStates.hue = value;
        this.handleRequest(true, value, characteristicHue);
        this.log("set 'Hue' to => " + value);
        callback();

    },

    getSaturation: function (callback) {

        logUpdates = false;
        callback(null, savedStates.saturation);
        this.handleRequest(false, 0, characteristicSaturation);
    
    },
    
    setSaturation: function (value, callback) {
        
        logUpdates = false;
        savedStates.saturation = value;
        this.handleRequest(true, value, characteristicSaturation);
        this.log("set 'Saturation' to => " + value);
        callback();

    },
    
    identify: function (callback) {

        callback();
    
    },

    getServices: function () {

        this.informationService = new Service.AccessoryInformation();

        this.informationService
            .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
            .setCharacteristic(Characteristic.Model, this.model)
            .setCharacteristic(Characteristic.SerialNumber, this.serial)
            .setCharacteristic(Characteristic.FirmwareRevision, this.firmware);
            
        this.service.getCharacteristic(Characteristic.On)
            .on("get", this.getOn.bind(this))
            .on("set", this.setOn.bind(this));
        
        this.service.getCharacteristic(Characteristic.Hue)
            .on("get", this.getHue.bind(this))
            .on("set", this.setHue.bind(this));
        
        this.service.getCharacteristic(Characteristic.Saturation)
            .on("get", this.getSaturation.bind(this))
            .on("set", this.setSaturation.bind(this));
        
        this.service.getCharacteristic(Characteristic.Brightness)
            .on("get", this.getBrightness.bind(this))
            .on("set", this.setBrightness.bind(this));
        
        return [this.informationService, this.service];

  }

}