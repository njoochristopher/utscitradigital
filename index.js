const imageInput = document.querySelector('#image-file');
const imageUrlForm = document.querySelector('#image-url-form');
const imageUrlInput = document.querySelector('#image-url');
const preview = document.querySelector('#preview');
const paletteContainer = document.querySelector('#palette');
const statusMessage = document.querySelector('#status');
const paletteSize = 6;
let currentImageUrl;
let currentRequest = 0;

imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    resetAnalysis();
    statusMessage.textContent = 'The selected file is not a valid image.';
    return;
  }

  imageUrlInput.value = '';
  const imageUrl = URL.createObjectURL(file);
  analyzeImage(imageUrl, { objectUrl: imageUrl });
});

imageUrlForm.addEventListener('submit', (event) => {
  event.preventDefault();
  let parsedUrl;
  try {
    parsedUrl = new URL(imageUrlInput.value.trim());
  } catch {
    statusMessage.textContent = 'Enter a valid image URL.';
    return;
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    statusMessage.textContent = 'Image URLs must use HTTP or HTTPS.';
    return;
  }

  imageInput.value = '';
  analyzeImage(parsedUrl.href, { crossOrigin: true });
});

function resetAnalysis() {
  const request = ++currentRequest;
  if (currentImageUrl) {
    URL.revokeObjectURL(currentImageUrl);
    currentImageUrl = undefined;
  }
  paletteContainer.replaceChildren();
  preview.removeAttribute('src');
  return request;
}

function analyzeImage(source, { objectUrl, crossOrigin = false } = {}) {
  const request = resetAnalysis();
  if (!window.ColorThief?.getPalette) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    statusMessage.textContent = 'Color Thief could not be loaded. Check your internet connection and try again.';
    console.error('Color Thief library is unavailable.');
    return;
  }

  currentImageUrl = objectUrl;
  const image = new Image();
  statusMessage.textContent = 'Analyzing image...';

  image.onload = async () => {
    if (request !== currentRequest) return;

    preview.src = source;
    try {
      const colors = await window.ColorThief.getPalette(image, {
        colorCount: paletteSize,
      });
      if (request !== currentRequest) return;

      renderPalette(colors);
      statusMessage.textContent = `Found ${colors.length} colors in the image.`;
    } catch (error) {
      if (request !== currentRequest) return;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      currentImageUrl = undefined;
      preview.removeAttribute('src');
      statusMessage.textContent = crossOrigin
        ? 'Could not read colors from this URL. The image host may block cross-origin access (CORS). Try another image URL.'
        : 'Could not analyze this image. Try another image file.';
      console.error('Failed to extract image palette:', error);
    }
  };

  image.onerror = () => {
    if (request !== currentRequest) return;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    currentImageUrl = undefined;
    statusMessage.textContent = 'Could not load the image. Check the URL or make sure the file is a valid image.';
  };

  if (crossOrigin) image.crossOrigin = 'anonymous';
  image.src = source;
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
