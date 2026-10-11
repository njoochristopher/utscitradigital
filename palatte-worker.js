// palette-worker.js
import { getPalette } from 'colorthief';

self.onmessage = async ({ data }) => {
    const palette = await getPalette(data.bitmap, { colorCount: 5 });
    // Color objects don't survive structured clone — send plain data
    self.postMessage({ palette: palette.map((c) => c.hex()) });
};
