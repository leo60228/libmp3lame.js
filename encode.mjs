import LAMEConfig from './lib/index.js';
import fsCallbacks from 'fs';

const fs = fsCallbacks.promises;

const data = Array.from({length: 500000}, (_, x) => {
    const freq = Math.sin((2 * Math.PI) / 44100 * x) * 200 + 440;
    const period = 44100 / freq;
    return (Math.sin(((2 * Math.PI) / period) * x) * 20000) | 0;
});

let config = new LAMEConfig();
config.setChannels(1);
config.setInputSampleRate(44100);
config.setOutputSampleRate(22050);
config.setBitrate(48);

let lame = await config.build(1024*1024*10);
lame.encode(data);
lame.flush();

const buffer = lame.buffer();
await fs.writeFile('out.mp3', buffer);
