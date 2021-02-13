import LAMEConfig from '../../../lib/index.js';

async function transcode(data) {
    const audioCtx = new AudioContext({ sampleRate: 44100 });

    console.time('decoding');
    const audio = await audioCtx.decodeAudioData(data);
    console.timeEnd('decoding');

    let config = new LAMEConfig();
    config.setChannels(2);
    config.setInputSampleRate(44100);
    config.setOutputSampleRate(22050);
    config.setBitrate(48);

    let lame = await config.build(1024*1024*10);

    console.time('encoding');
    lame.encodeFloats(audio.getChannelData(0), audio.getChannelData(1));
    lame.flush();
    console.timeEnd('encoding');

    const buffer = lame.buffer();
    const blob = new Blob([buffer], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.style = 'display: none';
    document.body.appendChild(a);
    a.href = url;
    a.download = 'out.mp3';
    a.click();
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
