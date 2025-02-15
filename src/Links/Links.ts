import * as Leap from "@mkellsy/leap-client";
import * as Baf from "@mkellsy/baf-client";
import * as Interfaces from "@mkellsy/hap-device";

import fs from "fs";
import os from "os";
import path from "path";

import { LinkType, parseLinkType } from "./LinkType";
import { Logger } from "../Logger";

const log = Logger.get("Links");

/**
 * Defines how devices are linked to each other.
 * @private
 */
export class Links {
    private readonly links: Map<string, string> = new Map();
    private readonly devices: Map<string, Interfaces.Device> = new Map();

    private readonly filename = path.join(os.homedir(), ".leap/links.json");

    constructor() {
        const values: string[][] = [];

        if (fs.existsSync(this.filename)) {
            values.push(...JSON.parse(fs.readFileSync(this.filename).toString()));
        }

        for (const value of values) {
            this.links.set(value[0], value[1]);
        }
    }

    /**
     * Adds an available device. All devices are needed because the links are
     * by device id.
     *
     * @param device The discovered device to add.
     */
    public set(device: Interfaces.Device): void {
        this.devices.set(device.id, device);
    }

    /**
     * Update a device's linked devices.
     *
     * @param device The device that just updated.
     * @param status The status of the device.
     */
    public update(device: Interfaces.Device, status: Interfaces.DeviceState): void {
        const linked = this.devices.get(this.links.get(device.id) || "");

        if (linked == null) {
            return;
        }

        this.syncDevices(device, linked, status).catch((error: Error) => console.error(error.message));
    }

    /*
     * Executes the desired action on the linked device
     */
    private async syncDevices(
        device: Interfaces.Device,
        linked: Interfaces.Device,
        status: Interfaces.DeviceState,
    ): Promise<void> {
        let level: number;
        let speed: number;

        let opposing: Interfaces.Device | undefined;

        switch (parseLinkType(device, linked)) {
            case LinkType.DimmerToDimmer:
                level = (status as Leap.DimmerState).level;
                opposing = this.getOpposing(linked);

                log.info(`linked dimmer ${linked.id}`);

                if (opposing != null && opposing.status.state === "On" && level > 0) {
                    log.info(`oposing dimmer ${opposing.id}`);

                    await this.updateLevel(opposing, 0);

                    setTimeout(async () => {
                        await this.updateLevel(linked, level);
                    }, 250);
                } else {
                    await this.updateLevel(linked, level);
                }

                break;

            case LinkType.DimmerToFan:
                speed = this.levelToSpeed((status as Leap.DimmerState).level, linked.status);
                level = this.speedToLevel(speed);

                log.info(`linked fan ${linked.id}`);

                await this.updateSpeed(device, linked, speed);
                break;
        }
    }

    /*
     * Converts a fan speed level to a dimmer level.
     */
    private speedToLevel(speed: number): number {
        return Math.round((speed / 7) * 100);
    }

    /*
     * Updates the brightness level of a dimmer.
     */
    private updateLevel(device: Interfaces.Device, level: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const state = level > 0 ? "On" : "Off";

            log.info(`updating dimmer, state: ${state}, level: ${level}.`);

            (device as Leap.Dimmer)
                .set({ ...device.status, state, level })
                .then(() => resolve())
                .catch((error: Error) => reject(error));
        });
    }

    /*
     * Converts a dimmer level to a fan speed.
     */
    private levelToSpeed(value: number, status: Interfaces.DeviceState): number {
        const currentSpeed: number = (status as Baf.FanState).speed;
        const currentLevel: number = this.speedToLevel(currentSpeed);

        if (Math.abs(value - currentLevel) > 10) {
            return Math.round((value / 100) * 7);
        }

        if (value > currentLevel) {
            return Math.ceil((value / 100) * 7);
        }

        return Math.floor((value / 100) * 7);
    }

    /*
     * Updates the rotation speed of a fan.
     */
    private updateSpeed(dimmer: Interfaces.Device, device: Interfaces.Device, speed: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const state = speed > 0 ? "On" : "Off";
            const level = this.speedToLevel(speed);

            log.info(`updating fan, state: ${state}, speed: ${speed}.`);

            this.updateLevel(dimmer, level)
                .then(() => {
                    (device as Baf.Fan)
                        .set({ ...(device.status as Baf.FanState), state, speed })
                        .then(() => resolve())
                        .catch((error: Error) => reject(error));
                })
                .catch((error: Error) => reject(error));
        });
    }

    /*
     * BAF has two opposing lights, where one turns off when the other turns on.
     */
    private getOpposing(device: Interfaces.Device): Interfaces.Device | undefined {
        if (device.id.indexOf("DOWNLIGHT") >= 0) {
            return this.getControl(device.id.replace("DOWNLIGHT", "UPLIGHT"));
        }

        if (device.id.indexOf("UPLIGHT") >= 0) {
            return this.getControl(device.id.replace("UPLIGHT", "DOWNLIGHT"));
        }

        return undefined;
    }

    /*
     * Fetches the control device from a linked device.
     */
    private getControl(id: string): Interfaces.Device | undefined {
        for (const [key, value] of this.links.entries()) {
            if (value === id) {
                return this.devices.get(key);
            }
        }

        return undefined;
    }
}
