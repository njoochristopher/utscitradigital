const imageInput = document.querySelector('#imgfile');
const preview = document.querySelector('#preview');
const paletteContainer = document.querySelector('#palette');
const statusMessage = document.querySelector('#status');
const paletteSize = 6;
let currentImageUrl;
let currentRequest = 0;

imageInput.addEventListener('change', analyzeSelectedImage);

async function analyzeSelectedImage() {
  const request = ++currentRequest;
  if (currentImageUrl) {
    URL.revokeObjectURL(currentImageUrl);
    currentImageUrl = undefined;
  }

  paletteContainer.replaceChildren();
  preview.removeAttribute('src');
  const file = imageInput.files[0];

  if (!file) {
    statusMessage.textContent = 'Pilih gambar untuk memulai.';
    return;
  }

  if (!file.type.startsWith('image/')) {
    statusMessage.textContent = 'File yang dipilih bukan gambar yang valid.';
    return;
  }

  const imageUrl = URL.createObjectURL(file);
  currentImageUrl = imageUrl;
  const image = new Image();
  statusMessage.textContent = 'Sedang menganalisis gambar...';

  image.onload = async () => {
    if (request !== currentRequest) return;
    preview.src = imageUrl;
    try {
      const colors = await ColorThief.getPalette(image, { colorCount: paletteSize });
      if (request !== currentRequest) return;
      renderPalette(colors);
      statusMessage.textContent = `Berhasil menemukan ${colors.length} warna dari gambar.`;
    } catch (error) {
      if (request !== currentRequest) return;
      URL.revokeObjectURL(imageUrl);
      currentImageUrl = undefined;
      statusMessage.textContent = 'Gambar tidak dapat dianalisis. Coba file gambar lain.';
      console.error('Gagal membaca warna gambar:', error);
    }
  };

  image.onerror = () => {
    if (request !== currentRequest) return;
    URL.revokeObjectURL(imageUrl);
    currentImageUrl = undefined;
    statusMessage.textContent = 'Gambar gagal dimuat. Pastikan file tidak rusak.';
  };

  image.src = imageUrl;
}

function renderPalette(colors) {
  const swatches = colors.map((color, index) => {
    const hex = color.hex().toUpperCase();
    const card = document.createElement('article');
    card.className = 'color-card';

    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = hex;
    swatch.setAttribute('aria-label', `Sampel warna ${index + 1}: ${hex}`);

    const code = document.createElement('button');
    code.className = 'hex-code';
    code.type = 'button';
    code.textContent = hex;
    code.title = 'Klik untuk menyalin kode HEX';
    code.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(hex);
        statusMessage.textContent = `Kode ${hex} disalin.`;
      } catch (error) {
        statusMessage.textContent = `Kode warna: ${hex}`;
        console.error('Gagal menyalin kode warna:', error);
      }
    });

    card.append(swatch, code);
    return card;
  });

  paletteContainer.replaceChildren(...swatches);
}
