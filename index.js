const imageInput = document.querySelector('#image-file');
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
    statusMessage.textContent = 'Choose an image to get started.';
    return;
  }

  if (!file.type.startsWith('image/')) {
    statusMessage.textContent = 'The selected file is not a valid image.';
    return;
  }

  if (!window.ColorThief?.getPalette) {
    statusMessage.textContent = 'Color Thief could not be loaded. Check your internet connection and try again.';
    console.error('Color Thief library is unavailable.');
    return;
  }

  const imageUrl = URL.createObjectURL(file);
  currentImageUrl = imageUrl;
  const image = new Image();
  statusMessage.textContent = 'Analyzing image...';

  image.onload = async () => {
    if (request !== currentRequest) return;

    preview.src = imageUrl;
    try {
      const colors = await window.ColorThief.getPalette(image, {
        colorCount: paletteSize,
      });
      if (request !== currentRequest) return;

      renderPalette(colors);
      statusMessage.textContent = `Found ${colors.length} colors in the image.`;
    } catch (error) {
      if (request !== currentRequest) return;
      URL.revokeObjectURL(imageUrl);
      currentImageUrl = undefined;
      preview.removeAttribute('src');
      statusMessage.textContent = 'Could not analyze this image. Try another image file.';
      console.error('Failed to extract image palette:', error);
    }
  };

  image.onerror = () => {
    if (request !== currentRequest) return;
    URL.revokeObjectURL(imageUrl);
    currentImageUrl = undefined;
    statusMessage.textContent = 'Could not load the image. Make sure the file is not damaged.';
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
    swatch.setAttribute('aria-label', `Color ${index + 1}: ${hex}`);

    const code = document.createElement('button');
    code.className = 'hex-code';
    code.type = 'button';
    code.textContent = hex;
    code.title = 'Click to copy HEX code';
    code.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(hex);
        statusMessage.textContent = `Copied ${hex}.`;
      } catch (error) {
        statusMessage.textContent = `HEX color: ${hex}`;
        console.error('Failed to copy color code:', error);
      }
    });

    card.append(swatch, code);
    return card;
  });

  paletteContainer.replaceChildren(...swatches);
}
