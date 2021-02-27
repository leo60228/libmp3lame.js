import LAMEConfig from '../../../lib/index.js';

const chunkSize = 44100 * 10;

onmessage = async (evt) => {
    const [left, right] = evt.data;

    const chunks = Math.ceil(left.length / chunkSize);

    for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min((i + 1) * chunkSize, left.length);

        const leftChunk = left.subarray(start, end);
        const rightChunk = right.subarray(start, end);

        let config = new LAMEConfig();
        config.setChannels(2);
        config.setInputSampleRate(44100);
        config.setOutputSampleRate(22050);
        config.setBitrate(48);

        let lame = await config.build(1024 * 1024 * 10);

        console.time('encoding');
        console.log('encoding');
        lame.encodeFloats(leftChunk, rightChunk);
        lame.flush();
        console.timeEnd('encoding');

        const encoded = lame.buffer();
        const encodedBuffer = encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength);

        postMessage(encodedBuffer);
    }
};
