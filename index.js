var colorThief = new ColorThief();
img.onload = function(){
    var ct = new ColorThief;
    var palette = ct.getPalette(img, 10, 6);
}
img.src = URLSearchParams(file);

import { getColorSync, getPaletteSync, getSwatches } from 'colorthief';

// Dominant color
const color = getColorSync(img);
color.hex();      // '#e84393'
color.css();      // 'rgb(232, 67, 147)'
color.isDark;     // false
color.textColor;  // '#000000'

// Palette
const palette = getPaletteSync(img, { colorCount: 6 });
palette.forEach(c => console.log(c.hex()));

// Semantic swatches (Vibrant, Muted, DarkVibrant, etc.)
const swatches = await getSwatches(img);
swatches.Vibrant?.color.hex();
