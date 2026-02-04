// ==================== 전역 변수 ====================
const URL = "https://teachablemachine.withgoogle.com/models/xUGcsPzPz/";
const THEME_KEY = 'zootopiaTheme';

let model, maxPredictions;
let uploadedImage = null;

// ==================== 테마 관리 함수 ====================

/**
 * 현재 테마 가져오기
 */
function getCurrentTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
}

/**
 * 테마 설정 및 저장
 */
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateThemeIcon(theme);
}

/**
 * 테마 아이콘 업데이트
 */
function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

/**
 * 테마 토글
 */
function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

/**
 * 테마 초기화
 */
function initializeTheme() {
    const savedTheme = getCurrentTheme();
    setTheme(savedTheme);
}

// ==================== 모델 초기화 ====================

/**
 * Teachable Machine 모델 로드
 */
async function loadModel() {
    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        console.log('모델 로드 완료');
    } catch (error) {
        console.error('모델 로드 실패:', error);
        alert('AI 모델 로드에 실패했습니다. 페이지를 새로고침해주세요.');
    }
}

// ==================== 이미지 업로드 처리 ====================

/**
 * 파일 선택 처리
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        processImage(file);
    } else {
        alert('이미지 파일만 업로드 가능합니다.');
    }
}

/**
 * 드래그 오버 처리
 */
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = document.getElementById('dropZone');
    dropZone.classList.add('drag-over');
}

/**
 * 드래그 떠남 처리
 */
function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = document.getElementById('dropZone');
    dropZone.classList.remove('drag-over');
}

/**
 * 드롭 처리
 */
function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const dropZone = document.getElementById('dropZone');
    dropZone.classList.remove('drag-over');

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            processImage(file);
        } else {
            alert('이미지 파일만 업로드 가능합니다.');
        }
    }
}

/**
 * 이미지 처리 및 예측
 */
async function processImage(file) {
    const loading = document.getElementById('loading');
    const dropZone = document.getElementById('dropZone');
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');
    const resultSection = document.getElementById('resultSection');

    try {
        // 로딩 표시
        loading.style.display = 'block';
        dropZone.style.display = 'none';
        imagePreview.style.display = 'none';

        // 모델이 아직 로드되지 않았다면 로드
        if (!model) {
            await loadModel();
        }

        // 이미지를 읽어서 프리뷰 표시
        const reader = new FileReader();
        reader.onload = async function(e) {
            previewImage.src = e.target.result;

            // 이미지 객체 생성
            const img = new Image();
            img.onload = async function() {
                uploadedImage = img;

                // 로딩 숨김, 프리뷰 표시
                loading.style.display = 'none';
                imagePreview.style.display = 'block';

                // 예측 실행
                await predict(img);

                // 결과 섹션 표시
                resultSection.style.display = 'block';
                resultSection.scrollIntoView({ behavior: 'smooth' });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);

    } catch (error) {
        console.error('이미지 처리 오류:', error);
        alert('이미지 처리에 실패했습니다.');
        loading.style.display = 'none';
        dropZone.style.display = 'block';
    }
}

/**
 * 이미지 예측
 */
async function predict(image) {
    try {
        const labelContainer = document.getElementById('label-container');

        // 예측 실행
        const prediction = await model.predict(image);

        // 확률 순으로 정렬
        prediction.sort((a, b) => b.probability - a.probability);

        // 결과 표시 영역 초기화
        labelContainer.innerHTML = '';

        // 결과 표시
        for (let i = 0; i < maxPredictions; i++) {
            const className = prediction[i].className;
            const probability = prediction[i].probability;
            const percentage = (probability * 100).toFixed(1);

            const predictionItem = document.createElement('div');
            predictionItem.className = 'prediction-item';
            predictionItem.innerHTML = `
                <div class="character-name">${className}</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${percentage}%">
                        <span class="percentage">${percentage}%</span>
                    </div>
                </div>
            `;
            labelContainer.appendChild(predictionItem);
        }
    } catch (error) {
        console.error('예측 오류:', error);
        alert('이미지 분석에 실패했습니다.');
    }
}

/**
 * 업로드 초기화
 */
function resetUpload() {
    const dropZone = document.getElementById('dropZone');
    const imagePreview = document.getElementById('imagePreview');
    const resultSection = document.getElementById('resultSection');
    const imageUpload = document.getElementById('imageUpload');

    dropZone.style.display = 'block';
    imagePreview.style.display = 'none';
    resultSection.style.display = 'none';
    imageUpload.value = '';
    uploadedImage = null;

    // 드롭존으로 스크롤
    dropZone.scrollIntoView({ behavior: 'smooth' });
}

// ==================== 드래그 앤 드롭 설정 ====================

/**
 * 드래그 앤 드롭 이벤트 리스너 설정
 */
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    const imageUpload = document.getElementById('imageUpload');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const resetUploadBtn = document.getElementById('resetUploadBtn');

    // 파일 선택 이벤트
    imageUpload.addEventListener('change', handleFileSelect);

    // 파일 선택 버튼 클릭 (이벤트 전파 방지)
    selectFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        imageUpload.click();
    });

    // 다시 업로드 버튼 클릭
    resetUploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetUpload();
    });

    // 드롭존 클릭 시 파일 선택 (버튼이 아닌 영역 클릭 시에만)
    dropZone.addEventListener('click', (e) => {
        // 버튼을 클릭한 경우는 제외
        if (e.target !== selectFileBtn && !selectFileBtn.contains(e.target)) {
            imageUpload.click();
        }
    });

    // 드래그 앤 드롭 이벤트
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    // 전체 페이지에서 드래그 앤 드롭 방지 (브라우저 기본 동작)
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, (e) => {
            if (!dropZone.contains(e.target)) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, false);
    });
}

// ==================== 이벤트 리스너 설정 ====================

/**
 * 모든 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 테마 토글 버튼
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // 드래그 앤 드롭 설정
    setupDragAndDrop();
}

// ==================== 앱 초기화 ====================

/**
 * 앱 초기화
 */
async function initializeApp() {
    console.log('주토피아 닮은 꼴 찾기 서비스를 시작합니다...');

    // 테마 초기화
    initializeTheme();

    // 이벤트 리스너 설정
    setupEventListeners();

    // 모델 미리 로드 (선택적)
    // await loadModel();

    console.log('초기화 완료!');
}

// ==================== 앱 실행 ====================

// DOM이 로드되면 앱 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
