// Teachable Machine Model URL
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/2vxN9KUe7/";

// Animal Data (license-safe local assets)
const characters = {
    "rabbit": {
        image: "assets/character-rabbit.png",
        nameKo: "토끼",
        nameEn: "Rabbit"
    },
    "dog": {
        image: "assets/character-dog.png",
        nameKo: "강아지",
        nameEn: "Dog"
    },
    "cat": {
        image: "assets/character-cat.png",
        nameKo: "고양이",
        nameEn: "Cat"
    },
    "fox": {
        image: "assets/character-fox.png",
        nameKo: "여우",
        nameEn: "Fox"
    },
    "tiger": {
        image: "assets/character-tiger.png",
        nameKo: "호랑이",
        nameEn: "Tiger"
    }
};

// Global variables
let model;
let maxPredictions;
let currentImageElement;

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const uploadSection = document.getElementById('upload-section');
const loading = document.getElementById('loading');
const resultSection = document.getElementById('result-section');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const tryAgainButton = document.getElementById('try-again-button');
const dropZoneText = document.querySelector('.drop-zone-text');
const dropZoneHint = document.querySelector('.drop-zone-hint');

let uploadEnabled = true;

// Initialize when page loads
window.addEventListener('load', async () => {
    if (!hasRequiredElements()) {
        console.warn('Required elements not found. Skipping app initialization.');
        return;
    }
    await loadModel();
    setupEventListeners();
});

// Load Teachable Machine Model
async function loadModel() {
    try {
        setUploadEnabled(false, '모델을 불러오는 중입니다. 잠시만 기다려 주세요.');
        showLoading('모델을 불러오는 중입니다...');
        const modelURL = MODEL_URL + "model.json";
        const metadataURL = MODEL_URL + "metadata.json";

        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        hideLoading();
        setUploadEnabled(true);
        console.log('Model loaded successfully');
    } catch (error) {
        console.error('Error loading model:', error);
        showError('모델을 불러오는데 실패했습니다. 인터넷 연결을 확인해주세요.');
        hideLoading();
        setUploadEnabled(true);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    if (!hasRequiredElements()) {
        return;
    }
    // Upload button click
    uploadButton.addEventListener('click', (e) => {
        if (!uploadEnabled) return;
        e.stopPropagation(); // Prevent event bubbling to dropZone
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0]);
    });

    // Drag and drop events
    dropZone.addEventListener('click', () => {
        if (!uploadEnabled) return;
        fileInput.click();
    });

    dropZone.addEventListener('dragover', (e) => {
        if (!uploadEnabled) return;
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        if (!uploadEnabled) return;
        e.preventDefault();
        dropZone.classList.remove('drag-over');

        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    });

    // Analyze button removed (auto analyze on upload)

    // Try again button
    tryAgainButton.addEventListener('click', resetApp);
}

function hasRequiredElements() {
    return !!(
        dropZone &&
        fileInput &&
        uploadButton &&
        uploadSection &&
        loading &&
        resultSection &&
        errorMessage &&
        errorText &&
        tryAgainButton
    );
}

function setUploadEnabled(enabled, statusMessage) {
    if (!dropZone || !fileInput || !uploadButton) {
        return;
    }
    uploadEnabled = enabled;
    fileInput.disabled = !enabled;
    uploadButton.disabled = !enabled;
    dropZone.classList.toggle('is-disabled', !enabled);
    dropZone.setAttribute('aria-disabled', String(!enabled));
    dropZone.setAttribute('aria-busy', String(!enabled));

    if (dropZoneText && dropZoneHint) {
        if (!dropZoneText.dataset.defaultText) {
            dropZoneText.dataset.defaultText = dropZoneText.textContent || '';
        }
        if (!dropZoneHint.dataset.defaultText) {
            dropZoneHint.dataset.defaultText = dropZoneHint.textContent || '';
        }
        if (enabled) {
            dropZoneText.textContent = dropZoneText.dataset.defaultText;
            dropZoneHint.textContent = dropZoneHint.dataset.defaultText;
        } else {
            dropZoneText.textContent = '모델을 준비 중입니다';
            dropZoneHint.textContent = statusMessage || '잠시만 기다려 주세요.';
        }
    }
}

// Handle File Selection
function handleFileSelect(file) {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
        showError('JPG 또는 PNG 이미지 파일만 업로드 가능합니다.');
        return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showError('파일 크기가 너무 큽니다. 10MB 이하의 파일을 업로드해주세요.');
        return;
    }

    // Read and analyze image
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageElement = new Image();
        imageElement.onload = async () => {
            currentImageElement = imageElement;
            hideError();
            resultSection.style.display = 'none';
            await predictImage(currentImageElement);
        };
        imageElement.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Predict Image
async function predictImage(imageElement) {
    if (!model) {
        showError('모델이 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
        return;
    }

    try {
        showLoading('AI가 분석 중입니다...');
        hideError();

        // Make prediction
        const predictions = await model.predict(imageElement);

        // Sort predictions by probability (highest first)
        const sortedPredictions = predictions
            .map(prediction => ({
                className: prediction.className,
                probability: prediction.probability
            }))
            .sort((a, b) => b.probability - a.probability);

        // Get top 3 results
        const top3 = sortedPredictions.slice(0, 3);

        hideLoading();
        await showResult(top3);

    } catch (error) {
        console.error('Error during prediction:', error);
        showError('이미지 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
        hideLoading();
    }
}

// Show Result
async function showResult(top3Predictions) {
    if (!resultSection || !uploadSection) {
        return;
    }
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) {
        return;
    }
    resultsContainer.innerHTML = ''; // Clear previous results

    const rankEmojis = ['🥇', '🥈', '🥉'];
    const rankClasses = ['rank-1', 'rank-2', 'rank-3'];

    top3Predictions.forEach((prediction, index) => {
        const character = getCharacterForPrediction(prediction.className);

        const percentage = Math.round(prediction.probability * 100);
        const rank = index + 1;

        // Create result card
        const card = document.createElement('div');
        card.className = `result-card ${rankClasses[index]}`;

        // Add rank badge
        const rankBadge = document.createElement('div');
        rankBadge.className = 'rank-badge';
        rankBadge.textContent = rankEmojis[index];
        card.appendChild(rankBadge);

        // Add character image
        const img = document.createElement('img');
        img.className = 'result-character-image';
        img.src = character.image;
        img.alt = character.nameKo;
        card.appendChild(img);

        // Add card content
        const content = document.createElement('div');
        content.className = 'result-card-content';

        const name = document.createElement('h3');
        name.className = 'result-character-name';
        name.textContent = character.nameKo;
        content.appendChild(name);

        const similarityContainer = document.createElement('div');
        similarityContainer.className = 'similarity-container';

        const label = document.createElement('p');
        label.className = 'similarity-label';
        label.textContent = '유사도';
        similarityContainer.appendChild(label);

        const bar = document.createElement('div');
        bar.className = 'similarity-bar';
        const fill = document.createElement('div');
        fill.className = 'similarity-fill';
        fill.style.width = '0%';
        bar.appendChild(fill);
        similarityContainer.appendChild(bar);

        const percentageText = document.createElement('p');
        percentageText.className = 'similarity-percentage';
        percentageText.textContent = percentage + '%';
        similarityContainer.appendChild(percentageText);

        content.appendChild(similarityContainer);
        card.appendChild(content);

        resultsContainer.appendChild(card);

        // Animate similarity bar after a short delay
        setTimeout(() => {
            fill.style.width = percentage + '%';
        }, 100 + (index * 100));
    });

    // Show result section
    resultSection.style.display = 'block';
    uploadSection.style.display = 'none';

    await waitForResultImages(resultsContainer);

    const resultHeading = resultSection.querySelector('h2');
    const scrollTarget = resultHeading || resultSection;
    scrollTarget.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function waitForResultImages(container) {
    const images = Array.from(container.querySelectorAll('img'));
    if (!images.length) {
        return Promise.resolve();
    }

    const waits = images.map((img) => {
        if (img.complete) {
            return Promise.resolve();
        }
        if (typeof img.decode === 'function') {
            return img.decode().catch(() => {});
        }
        return new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
        });
    });

    return Promise.all(waits);
}

function waitForResultAnimations(cardCount) {
    const animationDelayBase = 100;
    const animationDelayStep = 100;
    const animationDuration = 1000;
    const totalDelay = animationDelayBase + Math.max(0, cardCount - 1) * animationDelayStep + animationDuration;
    return new Promise((resolve) => setTimeout(resolve, totalDelay));
}

function getCharacterForPrediction(className) {
    const normalizedName = className.toLowerCase();
    if (characters[normalizedName]) {
        return characters[normalizedName];
    }

    const fallbackKeys = Object.keys(characters);
    const fallbackKey = fallbackKeys.length ? fallbackKeys[0] : null;
    if (!fallbackKey) {
        return {
            image: '',
            nameKo: '동물',
            nameEn: 'Animal'
        };
    }

    console.warn(`Unknown class name from model: ${className}. Using fallback.`);
    return characters[fallbackKey];
}

// Show Loading
function showLoading(message = 'Loading...') {
    loading.querySelector('p').textContent = message;
    loading.style.display = 'block';
    if (dropZone) {
        dropZone.classList.add('is-loading');
    }
}

// Hide Loading
function hideLoading() {
    loading.style.display = 'none';
    if (dropZone) {
        dropZone.classList.remove('is-loading');
    }
}

// Show Error
function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';

    // Auto hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

// Hide Error
function hideError() {
    errorMessage.style.display = 'none';
}

// Reset App
function resetApp() {
    if (!uploadSection || !resultSection) {
        return;
    }
    // Reset UI
    uploadSection.style.display = 'block';
    resultSection.style.display = 'none';
    hideError();
    hideLoading();

    // Reset image
    currentImageElement = null;
    fileInput.value = '';

    // Clear results
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }

    // Bring the upload section back into view for clarity
    setTimeout(() => {
        uploadSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 100);
}
