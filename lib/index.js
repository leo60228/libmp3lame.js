const Module = require('./libmp3lame.js');

class LAMEConfig {
    constructor() {
        this._channels = null;
        this._inputSampleRate = null;
        this._outputSampleRate = null;
        this._bitrate = null;
    }

    setChannels(channels) {
        this._channels = channels;
    }

    setInputSampleRate(sampleRate) {
        this._inputSampleRate = null;
    }

    setOutputSampleRate(sampleRate) {
        this._outputSampleRate = sampleRate;
    }

    setBitrate(bitrate) {
        this._bitrate = bitrate;
    }

    async build(size, wasm) {
        const module = await Module({
            locateFile(path, prefix) {
                if (path === 'libmp3lame.wasm' && wasm) {
                    return wasm;
                } else {
                    return prefix + path;
                }
            }
        });
        let config = new module.LAMEConfig();

        if (this._channels !== null) {
            config.setChannels(this._channels);
        }
        if (this._inputSampleRate !== null) {
            config.setInputSampleRate(this._inputSampleRate);
        }
        if (this._outputSampleRate !== null) {
            config.setOutputSampleRate(this._outputSampleRate);
        }
        if (this._bitrate !== null) {
            config.setBitrate(this._bitrate);
        }

        return config.build(size);
    }
}

module.exports = LAMEConfig;
