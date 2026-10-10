const imageInput = document.querySelector('#image-file');
const imageUrlForm = document.querySelector('#image-url-form');
const imageUrlInput = document.querySelector('#image-url');
const colorCountInput = document.querySelector('#color-count');
const preview = document.querySelector('#preview');
const paletteContainer = document.querySelector('#palette');
const statusMessage = document.querySelector('#status');
let currentImageUrl;
let currentRequest = 0;
let selectedImage;

imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    selectedImage = undefined;
    resetAnalysis();
    statusMessage.textContent = 'The selected file is not a valid image.';
    return;
  }

  imageUrlInput.value = '';
  selectedImage = { file };
  loadSelectedImage();
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
  selectedImage = { url: parsedUrl.href };
  loadSelectedImage();
});

colorCountInput.addEventListener('change', () => {
  if (selectedImage) loadSelectedImage();
});

function loadSelectedImage() {
  if (!selectedImage) return;

  if (selectedImage.file) {
    const imageUrl = URL.createObjectURL(selectedImage.file);
    analyzeImage(imageUrl, { objectUrl: imageUrl });
    return;
  }

  analyzeImage(selectedImage.url, { crossOrigin: true });
}

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
    const colorCount = Number(colorCountInput.value);
    if (!Number.isInteger(colorCount) || colorCount < 6 || colorCount > 10) {
      statusMessage.textContent = 'Choose between 6 and 10 colors.';
      return;
    }

    try {
      const colors = await window.ColorThief.getPalette(image, {
        colorCount,
      });
      if (request !== currentRequest) return;

      if (!Array.isArray(colors) || colors.length === 0) {
        paletteContainer.replaceChildren();
        statusMessage.textContent = 'No colors could be identified in this image.';
        return;
      }

      renderPalette(colors);
      statusMessage.textContent = `Found ${colors.length} ${colors.length === 1 ? 'color' : 'colors'} in the image.`;
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
    statusMessage.textContent = crossOrigin
      ? 'Could not load this image URL. Check the link and make sure its host allows cross-origin access (CORS).'
      : 'Could not load the image. Make sure the file is a valid image.';
  };

  if (crossOrigin) image.crossOrigin = 'anonymous';
  image.src = source;
}

function renderPalette(colors) {
  const swatches = colors.map((color, index) => {
    const hex = color.hex().toUpperCase();
    const card = document.createElement('article');
    card.className = 'color-card';
    card.setAttribute('role', 'listitem');

    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = hex;
    swatch.setAttribute('aria-label', `Color swatch ${index + 1}: ${hex}`);

    const code = document.createElement('button');
    code.className = 'hex-code';
    code.type = 'button';
    code.textContent = hex;
    code.title = 'Copy HEX code';
    code.setAttribute('aria-label', `Copy HEX color ${hex}`);
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
