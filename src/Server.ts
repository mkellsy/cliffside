import * as Baf from "@mkellsy/baf-client";
import * as Leap from "@mkellsy/leap-client";
import * as Interfaces from "@mkellsy/hap-device";

import { Links } from "./Links/Links";
import { Logger } from "./Logger";

const log = Logger.get("Server");

/**
 * Impliments a Homebridge platform plugin.
 * @private
 */
export class Server {
    private readonly links: Links;

    private leap?: Leap.Client;
    private baf?: Baf.Client;

    /**
     * Creates an instance to this plugin.
     */
    constructor() {
        this.links = new Links();
    }

    /**
     * Starts the standalone server.
     */
    public start(): void {
        if (this.leap != null) {
            log.info("closing LEAP client.");

            this.leap.off("Available", this.onAvailable).off("Update", this.onUpdate).close();
        }

        if (this.baf != null) {
            log.info("closing BAF client.");

            this.baf.off("Available", this.onAvailable).off("Update", this.onUpdate).close();
        }

        this.leap = Leap.connect().on("Available", this.onAvailable).on("Update", this.onUpdate);
        this.baf = Baf.connect().on("Available", this.onAvailable).on("Update", this.onUpdate);
    }

    /**
     * Stops the standalone server.
     */
    public stop(): void {
        if (this.leap != null) {
            log.info("closing LEAP client.");

            this.leap.off("Available", this.onAvailable).off("Update", this.onUpdate).close();
        }

        if (this.baf != null) {
            log.info("closing BAF client.");

            this.baf.off("Available", this.onAvailable).off("Update", this.onUpdate).close();
        }

        this.leap = undefined;
        this.baf = undefined;
    }

    /*
     * mDNS discovery listener. This will create devices when found and will
     * register with Homebridge or re-initialize the accessory if it is from
     * the cache.
     */
    private onAvailable = (devices: Interfaces.Device[]): void => {
        for (const device of devices) {
            if (
                device.type === Interfaces.DeviceType.Contact ||
                device.type === Interfaces.DeviceType.Dimmer ||
                device.type === Interfaces.DeviceType.Fan ||
                device.type === Interfaces.DeviceType.Shade ||
                device.type === Interfaces.DeviceType.Strip ||
                device.type === Interfaces.DeviceType.Switch
            ) {
                this.links.set(device);
            }
        }
    };

    /*
     * Device update listener. This recieves updates from the devices and will
     * relay the state to Homebridge.
     */
    private onUpdate = (device: Interfaces.Device, status: Interfaces.DeviceState): void => {
        if (
            device.type === Interfaces.DeviceType.Contact ||
            device.type === Interfaces.DeviceType.Dimmer ||
            device.type === Interfaces.DeviceType.Fan ||
            device.type === Interfaces.DeviceType.Shade ||
            device.type === Interfaces.DeviceType.Strip ||
            device.type === Interfaces.DeviceType.Switch
        ) {
            log.info(`recieved an update from ${device.id}`);

            this.links.update(device, status);
        }
    };
}
