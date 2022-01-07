#! /usr/bin/env node
const { HttpClient, IPDiscovery } = require('hap-controller');
const fs = require('fs');

let font = {
    bright : "\x1b[1m%s\x1b[0m",
    red : "\x1b[31m%s\x1b[0m",
    green : "\x1b[32m%s\x1b[0m",
    yellow : "\x1b[33m%s\x1b[0m"
};

let args = process.argv.slice(2);

if(args[0] == "pair") {

    if(args[1] && args[2]) {

        let ip = args[1];
        let pin = args[2];
        let discoveryTime = 0;
        let stopSearch = false;
    
        const discovery = new IPDiscovery();
        process.stdout.write("Search Device");
    
        discovery.on('serviceUp', async (service) => {
    
            if(service.address == ip) {
    
                console.log("");
                console.log(font.green, "Found " + service.name);
                discoveryTime = 30;
                stopSearch = true;
    
                if (service.availableToPair) {
    
                    console.log("Start pairing");
    
                    try {
                    
                        const pairMethod = await discovery.getPairMethod(service);
                        const client = new HttpClient(service.id, service.address, service.port);
                        await client.pairSetup(pin, pairMethod);
    
                        console.log(service.name + " successfully paired!");
                        
                        const pairingData = client.getLongTermData();
                        const data = {
                            accessory : "MiBedsideLamp2",
                            name: "Mi Bedside Lamp 2",
                            id: service.id,
                            address: service.address,
                            port: service.port,
                            pairingData                    
                        }
    
                        console.log("");
                        console.log("Paste the following into your homebridge config");
                        console.log("'name' is what you see in homebridge/homekit and can be changed");
                        console.log(font.green, "===========COPY START===========");
                        console.log(JSON.stringify(data, undefined, 4));
                        console.log(font.green, "============COPY END============");
    
                        let ipAddress = data.address;
                        let fileName = "bslamp-" + ipAddress.replace(/\./g, '-');
    
                        fs.writeFileSync(__dirname + "/" + fileName, JSON.stringify(data, undefined, 4));
    
                    } catch (e) {
    
                        console.log(font.red, service.name + " pairing failed");
                        console.log(font.red, "===========ERROR START===========");
                        console.log(e);
                        console.log(font.red, "============ERROR END============");
    
                    }
                
                } else {
    
                    console.log(font.red, service.name + " not available for pairing.");
                    console.log(font.yellow, "Please reset the device if you haven't paired it already.");
                    console.log("  - Hold the power button and the mode button for 5 seconds, the lamp will start flashing. After 3 seconds, it will restart and show white color, which means the lamp has been reset to default.");
                    console.log("  - Setup the wifi of the device with the yeelight/xiaomi home app and afterwards you can try the pairing again.");
            
                }
    
            }
    
        });
    
        discovery.start();
    
        const discoveryInterval = setInterval(() => {
    
            if(!stopSearch) {
    
                process.stdout.write(".");
            
            }
    
            if(discoveryTime == 30) {
    
                clearInterval(discoveryInterval);
                discovery.stop();
                
                if(!stopSearch) {
    
                    console.log("");
                    console.log(font.red, "No device found");
                    console.log("- Make sure the device is powered on and the wifi connection is working");
                    console.log("- If the device is already powered on and wifi is working, try unplugging it for a few seconds and then rerun the command immediately after plugging it in");
                
                } 
                
            }
            
            discoveryTime++;
    
        }, 1000);

    } else {
        
        console.log(font.red, "IP address or pairing code missing");
    
    }

} else if (args[0] == "unpair") {

    if(args[1] && args[1].includes("bslamp")) {

        let file = __dirname + "/" + args[1];
        let device;
    
        try {
            
            if (fs.existsSync(file)) {
    
                const data = fs.readFileSync(file, 'utf8');
                device = JSON.parse(data);
    
                const client = new HttpClient(device.id, device.address, device.port, device.pairingData);
    
                client.removePairing(client.pairingProtocol.iOSDevicePairingID)
                    .then(function() {
                        console.log(device.accessory + " with IP " + device.address + " successfully unpaired");
                        fs.unlinkSync(file);
                    })
                    .catch(function(e) {
                        console.log(device.name + font.red, "===========ERROR START===========");
                        console.log(e);
                        console.log(font.red, "============ERROR END============");
                        process.exit();
                    });
    
            } else {
    
                console.log(font.red, "No file under the given name found");
            
            }
    
        } catch (e) {
    
            console.log(font.red, "===========ERROR START===========");
            console.log(e);
            console.log(font.red, "============ERROR END============");
    
        }
        
    } else {
    
        console.log(font.red, "Filename wrong or missing");
        process.stdout.write("Usage: ");
        console.log(font.bright, "bslamp-unpair [filename]");
        console.log(" - [filename] is 'bslamp-' and the IP address of the device with '-' instead of '.' (e.g. bslamp-192-168-0-123)" );
        console.log(" - e.g.  'bslamp-192-168-0-123'" );
    
    }    

} else {

    console.log(font.bright, "bslamp help");
    console.log("=================================");
    process.stdout.write("Usage pair: ");
    console.log(font.bright, "bslamp pair [ip address] [pairing code]");
    console.log(" - e.g.  'bslamp pair 192.168.0.123 012-34-567'" );
    console.log("");
    process.stdout.write("Usage unpair: ");
    console.log(font.bright, "bslamp unpair [filename]");
    console.log(" - [filename] is 'bslamp-' and the IP address of the device with '-' instead of '.'" );
    console.log(" - e.g.  'bslamp unpair bslamp-192-168-0-123'" );
}