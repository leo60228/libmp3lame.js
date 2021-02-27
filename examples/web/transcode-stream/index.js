import LAMEConfig from '../../../lib/index.js';
import AudioFeeder from 'audio-feeder';

async function transcode(data) {
    const audioCtx = new AudioContext({ sampleRate: 44100 });

    console.time('decoding');
    const audio = await audioCtx.decodeAudioData(data);
    console.timeEnd('decoding');

    let feeder = new AudioFeeder();
    feeder.init(2, 44100);

    let encoder = new Worker(new URL('./worker.js', import.meta.url));
    let started = false;

    encoder.onmessage = async (evt) => {
        const encodedBuffer = evt.data;

        console.time('decoding');
        const encodedAudio = await audioCtx.decodeAudioData(encodedBuffer);
        console.timeEnd('decoding');

        feeder.bufferData([audio.getChannelData(0), audio.getChannelData(1)]);

        if (!started) {
            feeder.start();
            started = true;
        }
    };

    encoder.postMessage([audio.getChannelData(0), audio.getChannelData(1)]);
}

document.getElementById('file-input').addEventListener('change', evt => {
    const file = evt.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = evt => {
        const data = evt.target.result;
        transcode(data);
    };
    reader.readAsArrayBuffer(file);
});
