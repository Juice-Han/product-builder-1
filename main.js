// ==================== 전역 변수 ====================
let reviews = [];
let isEditMode = false;
let editingId = null;

const STORAGE_KEY = 'bookReviews';
const THEME_KEY = 'bookReviewsTheme';

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

// ==================== 데이터 관리 함수 ====================

/**
 * 고유 ID 생성 (타임스탬프 기반)
 */
function generateUniqueId() {
    return Date.now().toString();
}

/**
 * localStorage에서 독후감 데이터 가져오기
 */
function getReviewsFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === null) {
            return [];
        }
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('독후감 데이터 로드 실패:', error);
        return [];
    }
}

/**
 * localStorage에 독후감 저장
 */
function saveReviewsToStorage(reviewsData) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reviewsData));
        return true;
    } catch (error) {
        console.error('독후감 저장 실패:', error);
        alert('독후감 저장에 실패했습니다.');
        return false;
    }
}

/**
 * 새 독후감 추가 또는 기존 독후감 업데이트
 */
function saveReview(reviewData) {
    if (isEditMode && editingId) {
        // 수정 모드
        const index = reviews.findIndex(r => r.id === editingId);
        if (index !== -1) {
            reviews[index] = { ...reviewData, id: editingId, createdAt: reviews[index].createdAt };
        }
    } else {
        // 추가 모드
        const newReview = {
            ...reviewData,
            id: generateUniqueId(),
            createdAt: Date.now()
        };
        reviews.unshift(newReview); // 최신 순으로 추가
    }

    return saveReviewsToStorage(reviews);
}

/**
 * 독후감 삭제
 */
function deleteReview(id) {
    reviews = reviews.filter(r => r.id !== id);
    return saveReviewsToStorage(reviews);
}

/**
 * 전체 독후감 삭제
 */
function clearAllReviews() {
    reviews = [];
    return saveReviewsToStorage(reviews);
}

// ==================== 폼 검증 함수 ====================

/**
 * 제목 검증
 */
function validateTitle(title) {
    if (!title || title.trim() === '') {
        return '책 제목을 입력해주세요.';
    }
    if (title.length > 100) {
        return '책 제목은 100자 이하로 입력해주세요.';
    }
    return null;
}

/**
 * 저자 검증
 */
function validateAuthor(author) {
    if (!author || author.trim() === '') {
        return '저자명을 입력해주세요.';
    }
    if (author.length > 100) {
        return '저자명은 100자 이하로 입력해주세요.';
    }
    return null;
}

/**
 * 독후감 내용 검증
 */
function validateContent(content) {
    if (!content || content.trim() === '') {
        return '독후감 내용을 입력해주세요.';
    }
    if (content.trim().length < 10) {
        return '독후감은 최소 10자 이상 작성해주세요.';
    }
    return null;
}

/**
 * 오류 메시지 표시
 */
function showError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}Error`);
    const inputElement = document.getElementById(fieldId);

    if (errorElement && inputElement) {
        errorElement.textContent = message || '';
        if (message) {
            inputElement.classList.add('error');
        } else {
            inputElement.classList.remove('error');
        }
    }
}

/**
 * 모든 오류 메시지 초기화
 */
function clearErrors() {
    ['title', 'author', 'content'].forEach(field => {
        showError(field, '');
    });
}

/**
 * 폼 전체 검증
 */
function validateForm(formData) {
    const errors = {
        title: validateTitle(formData.title),
        author: validateAuthor(formData.author),
        content: validateContent(formData.content)
    };

    // 오류 메시지 표시
    Object.keys(errors).forEach(field => {
        showError(field, errors[field]);
    });

    // 오류가 없으면 true 반환
    return !Object.values(errors).some(error => error !== null);
}

// ==================== 폼 처리 함수 ====================

/**
 * 현재 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 폼 제출 처리
 */
function handleFormSubmit(event) {
    event.preventDefault();

    const formData = {
        title: document.getElementById('title').value.trim(),
        author: document.getElementById('author').value.trim(),
        content: document.getElementById('content').value.trim(),
        date: getCurrentDate()
    };

    // 폼 검증
    if (!validateForm(formData)) {
        return;
    }

    // 저장
    if (saveReview(formData)) {
        resetForm();
        exitEditMode();
        renderReviewsList();
        updateReviewCount();

        // 폼 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * 폼 초기화
 */
function resetForm() {
    document.getElementById('reviewForm').reset();
    document.getElementById('editId').value = '';
    clearErrors();
}

/**
 * 편집 모드 진입
 */
function enterEditMode(id) {
    const review = reviews.find(r => r.id === id);
    if (!review) return;

    isEditMode = true;
    editingId = id;

    // 폼에 데이터 로드
    document.getElementById('title').value = review.title;
    document.getElementById('author').value = review.author;
    document.getElementById('content').value = review.content;
    document.getElementById('editId').value = id;

    // UI 업데이트
    document.getElementById('formTitle').textContent = '독후감 수정';
    document.getElementById('submitBtn').textContent = '독후감 수정';
    document.getElementById('cancelBtn').style.display = 'inline-block';

    // 폼으로 스크롤
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

/**
 * 편집 모드 종료
 */
function exitEditMode() {
    isEditMode = false;
    editingId = null;

    // UI 초기화
    document.getElementById('formTitle').textContent = '새 독후감 작성';
    document.getElementById('submitBtn').textContent = '독후감 추가';
    document.getElementById('cancelBtn').style.display = 'none';
}

/**
 * 취소 버튼 클릭 처리
 */
function handleCancel() {
    resetForm();
    exitEditMode();
}

// ==================== UI 렌더링 함수 ====================

/**
 * 독후감 개수 업데이트
 */
function updateReviewCount() {
    const countElement = document.getElementById('reviewCount');
    const clearAllBtn = document.getElementById('clearAllBtn');

    if (countElement) {
        countElement.textContent = reviews.length;
    }

    if (clearAllBtn) {
        clearAllBtn.style.display = reviews.length > 0 ? 'inline-block' : 'none';
    }
}

/**
 * 빈 상태 표시/숨김
 */
function toggleEmptyState() {
    const emptyState = document.getElementById('emptyState');
    const reviewsList = document.getElementById('reviewsList');

    if (reviews.length === 0) {
        emptyState.style.display = 'block';
        reviewsList.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        reviewsList.style.display = 'grid';
    }
}

/**
 * 개별 독후감 카드 HTML 생성
 */
function createReviewCardHTML(review) {
    return `
        <div class="review-card">
            <div class="review-header">
                <h3>${escapeHtml(review.title)}</h3>
                <p class="author">저자: ${escapeHtml(review.author)}</p>
                <p class="date">${review.date}</p>
            </div>
            <div class="review-content">
                <p>${escapeHtml(review.content)}</p>
            </div>
            <div class="review-actions">
                <button class="edit-btn" onclick="handleEdit('${review.id}')">수정</button>
                <button class="delete-btn" onclick="handleDelete('${review.id}')">삭제</button>
            </div>
        </div>
    `;
}

/**
 * HTML 이스케이프 (XSS 방지)
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 전체 독후감 목록 렌더링
 */
function renderReviewsList() {
    const reviewsList = document.getElementById('reviewsList');

    if (reviews.length === 0) {
        reviewsList.innerHTML = '';
    } else {
        reviewsList.innerHTML = reviews.map(review => createReviewCardHTML(review)).join('');
    }

    toggleEmptyState();
    updateReviewCount();
}

// ==================== 이벤트 핸들러 ====================

/**
 * 수정 버튼 클릭
 */
function handleEdit(id) {
    enterEditMode(id);
}

/**
 * 삭제 버튼 클릭
 */
function handleDelete(id) {
    const review = reviews.find(r => r.id === id);
    if (!review) return;

    const confirmed = confirm(`"${review.title}" 독후감을 삭제하시겠습니까?`);
    if (confirmed) {
        if (deleteReview(id)) {
            renderReviewsList();

            // 삭제한 독후감이 편집 중이었다면 편집 모드 종료
            if (editingId === id) {
                resetForm();
                exitEditMode();
            }
        }
    }
}

/**
 * 전체 삭제 버튼 클릭
 */
function handleClearAll() {
    if (reviews.length === 0) return;

    const confirmed = confirm(`모든 독후감(${reviews.length}개)을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`);
    if (confirmed) {
        if (clearAllReviews()) {
            renderReviewsList();
            resetForm();
            exitEditMode();
        }
    }
}

// ==================== 이벤트 리스너 설정 ====================

/**
 * 모든 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 폼 제출
    const form = document.getElementById('reviewForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // 취소 버튼
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', handleCancel);
    }

    // 전체 삭제 버튼
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', handleClearAll);
    }

    // 테마 토글 버튼
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // 입력 시 실시간 오류 제거
    ['title', 'author', 'content'].forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            element.addEventListener('input', () => {
                if (element.classList.contains('error')) {
                    showError(field, '');
                }
            });
        }
    });
}

// ==================== 앱 초기화 ====================

/**
 * 앱 초기화
 */
function initializeApp() {
    console.log('독후감 서비스를 시작합니다...');

    // 테마 초기화
    initializeTheme();

    // localStorage에서 데이터 로드
    reviews = getReviewsFromStorage();
    console.log(`${reviews.length}개의 독후감을 불러왔습니다.`);

    // 이벤트 리스너 설정
    setupEventListeners();

    // UI 렌더링
    renderReviewsList();

    console.log('초기화 완료!');
}

// ==================== 앱 실행 ====================

// DOM이 로드되면 앱 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
