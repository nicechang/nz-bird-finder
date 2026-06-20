// ==========================================================================
// NZ Bird Finder - Application JavaScript
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // --- State Variables ---
  let birds = [];
  let currentImageBase64 = null;
  let currentImageMimeType = null;
  let editingBirdId = null;

  // --- DOM Elements ---
  const tabButtons = document.querySelectorAll('.tab-nav .tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Finder elements
  const searchForm = document.getElementById('search-form');
  const imageInput = document.getElementById('image-input');
  const dropZone = document.getElementById('drop-zone');
  const uploadPrompt = document.getElementById('upload-prompt');
  const uploadPreviewContainer = document.getElementById('upload-preview-container');
  const imagePreview = document.getElementById('image-preview');
  const removeImageBtn = document.getElementById('remove-image-btn');
  const descInput = document.getElementById('desc-input');
  const searchSubmitBtn = document.getElementById('search-submit-btn');

  // Results elements
  const resultEmptyState = document.getElementById('result-empty-state');
  const resultLoaderState = document.getElementById('result-loader-state');
  const resultContentArea = document.getElementById('result-content-area');
  const resultBadgePanel = document.getElementById('result-badge-panel');
  const resEngName = document.getElementById('res-eng-name');
  const resMaoriName = document.getElementById('res-maori-name');
  const resSciName = document.getElementById('res-sci-name');
  const resKoreanName = document.getElementById('res-korean-name');
  const resKoreanBox = document.getElementById('res-korean-box');
  const resDescription = document.getElementById('res-description');
  const resHabitat = document.getElementById('res-habitat');
  const resBehavior = document.getElementById('res-behavior');
  const resBookReference = document.getElementById('res-book-reference');
  const resBookSource = document.getElementById('res-book-source');
  const resAiSupplement = document.getElementById('res-ai-supplement');
  const resWebInfo = document.getElementById('res-web-info');
  const linkNzBirdsOnline = document.getElementById('link-nz-birds-online');
  const linkWikipedia = document.getElementById('link-wikipedia');

  // My Book elements
  const birdsGridContainer = document.getElementById('birds-grid-container');
  const bookCountBadge = document.getElementById('book-count-badge');
  const addBirdBtn = document.getElementById('add-bird-btn');
  const importBtn = document.getElementById('import-btn');
  const exportBtn = document.getElementById('export-btn');
  const importInput = document.getElementById('import-input');

  // Modal elements
  const birdModal = document.getElementById('bird-modal');
  const birdForm = document.getElementById('bird-form');
  const modalTitle = document.getElementById('modal-title');
  const closeModelBtn = document.getElementById('close-modal-btn');
  const cancelModalBtn = document.getElementById('cancel-modal-btn');
  
  // Settings elements
  const settingsForm = document.getElementById('settings-form');
  const apiKeyInput = document.getElementById('api-key-input');
  const ebirdTokenInput = document.getElementById('ebird-token-input');
  const toggleApiKeyBtn = document.getElementById('toggle-api-key-btn');
  const toggleKeyIcon = document.getElementById('toggle-key-icon');
  const modelSelect = document.getElementById('model-select');
  const testConnectionBtn = document.getElementById('test-connection-btn');
  const statusPanel = document.getElementById('status-panel');
  const statusDot = document.getElementById('status-dot');
  const statusTitle = document.getElementById('status-title');
  const statusDesc = document.getElementById('status-desc');

  // --- Initialize Lucide Icons ---
  lucide.createIcons();

  // --- Initialize App & Database ---
  initApp();

  async function initApp() {
    // 1. Load Settings
    const savedApiKey = localStorage.getItem('nz_birds_api_key');
    const savedModel = localStorage.getItem('nz_birds_model') || 'gemini-2.5-flash';
    
    if (savedApiKey) {
      apiKeyInput.value = savedApiKey;
      updateConnectionStatus('configured', 'API 키 저장됨', '연결 상태를 확인하려면 테스트 버튼을 눌러주세요.');
    } else {
      updateConnectionStatus('not-configured', 'API 키 설정 필요', 'AI 검색을 사용하려면 설정 탭에서 Gemini API Key를 입력해야 합니다.');
    }
    modelSelect.value = savedModel;

    const savedEbirdToken = localStorage.getItem('nz_birds_ebird_token');
    if (savedEbirdToken) {
      ebirdTokenInput.value = savedEbirdToken;
    }

    // 2. Load Bird Database
    const savedDatabase = localStorage.getItem('nz_birds_database');
    if (savedDatabase) {
      birds = JSON.parse(savedDatabase);
      updateBookUI();
    } else {
      // Fetch default pre-loaded birds database
      try {
        const response = await fetch('database.json');
        if (response.ok) {
          birds = await response.json();
          saveToStorage();
          updateBookUI();
        } else {
          console.error('Failed to load default database.json');
        }
      } catch (err) {
        console.error('Error fetching database.json:', err);
      }
    }
  }

  function saveToStorage() {
    localStorage.setItem('nz_birds_database', JSON.stringify(birds));
  }

  function updateBookUI() {
    bookCountBadge.textContent = `${birds.length}종`;
    renderBirdsGrid();
  }

  // --- Tab Navigation Logic ---
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      // Update buttons active class
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update content active class
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `tab-${targetTab}`) {
          content.classList.add('active');
        }
      });
    });
  });

  // --- Settings UI Handlers ---
  toggleApiKeyBtn.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleKeyIcon.setAttribute('data-lucide', 'eye-off');
    } else {
      apiKeyInput.type = 'password';
      toggleKeyIcon.setAttribute('data-lucide', 'eye');
    }
    lucide.createIcons();
  });

  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const key = apiKeyInput.value.trim();
    const model = modelSelect.value;
    const ebirdToken = ebirdTokenInput.value.trim();

    localStorage.setItem('nz_birds_api_key', key);
    localStorage.setItem('nz_birds_model', model);
    localStorage.setItem('nz_birds_ebird_token', ebirdToken);

    if (key) {
      updateConnectionStatus('configured', 'API 키 저장됨', '연결 테스트 버튼을 눌러 동작을 검증할 수 있습니다.');
      alert('설정이 저장되었습니다.');
    } else {
      updateConnectionStatus('not-configured', 'API 키 설정 필요', 'AI 검색을 사용하려면 설정 탭에서 Gemini API Key를 입력해야 합니다.');
      alert('API 키가 삭제되었습니다.');
    }
  });

  testConnectionBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    const model = modelSelect.value;

    if (!key) {
      alert('API 키를 먼저 입력해 주세요.');
      return;
    }

    testConnectionBtn.disabled = true;
    const originalText = testConnectionBtn.innerHTML;
    testConnectionBtn.innerHTML = '<i data-lucide="loader" class="animate-spin"></i><span>테스트 중...</span>';
    lucide.createIcons();

    updateConnectionStatus('loading', '테스트 중', 'Gemini API와 통신하고 있습니다...');

    const success = await testGeminiAPI(key, model);

    testConnectionBtn.disabled = false;
    testConnectionBtn.innerHTML = originalText;
    lucide.createIcons();

    if (success) {
      updateConnectionStatus('connected', '연결 성공!', 'Gemini API 키가 유효하며 정상 통신됩니다.');
      alert('연결 성공! Gemini API가 활성화되었습니다.');
    } else {
      updateConnectionStatus('error', '연결 실패', '유효하지 않은 API 키이거나 네트워크 에러입니다. 키를 다시 확인해 주세요.');
      alert('연결 실패: API 키 또는 네트워크 설정을 확인하세요.');
    }
  });

  function updateConnectionStatus(type, title, desc) {
    statusDot.className = 'status-indicator';
    statusDot.classList.add(type);
    
    if (type === 'loading') {
      statusDot.style.color = '#e5ad23'; // Amber pulse while checking
    } else {
      statusDot.removeAttribute('style');
    }
    
    statusTitle.textContent = title;
    statusDesc.textContent = desc;
  }

  // --- My Book CRUD Handlers ---
  
  // Render grid list
  function renderBirdsGrid() {
    birdsGridContainer.innerHTML = '';
    
    if (birds.length === 0) {
      birdsGridContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <i data-lucide="book" class="empty-icon"></i>
          <h3>등록된 새가 없습니다</h3>
          <p>오른쪽 상단의 '도감 등록' 버튼을 눌러 소장하신 책의 새 정보를 등록해 보세요.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    birds.forEach(bird => {
      const card = document.createElement('div');
      card.className = 'bird-db-card';
      
      const hasKo = bird.koreanName && bird.koreanName.trim() !== '' && bird.koreanName !== '공식 한국어 이름 없음';
      const koBadgeClass = hasKo ? 'db-ko-badge' : 'db-ko-badge none';
      const koBadgeText = hasKo ? bird.koreanName : '한국어 이름 없음';

      card.innerHTML = `
        <div>
          <div class="bird-card-header">
            <div class="bird-card-title">
              <h3>${bird.englishName}</h3>
              <span class="maori">${bird.maoriName ? bird.maoriName : ''}</span>
            </div>
            <span class="${koBadgeClass}">${koBadgeText}</span>
          </div>
          <div class="bird-card-body">
            ${bird.description}
          </div>
        </div>
        <div class="bird-card-meta">
          <span>${bird.sourceBookPage ? bird.sourceBookPage : '출처 미표기'} | ${bird.size ? bird.size : '크기 미상'}</span>
          <div class="card-actions">
            <button class="icon-btn edit-btn" data-id="${bird.id}" title="수정">
              <i data-lucide="edit-3"></i>
            </button>
            <button class="icon-btn delete-btn" data-id="${bird.id}" title="삭제">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `;

      // Event listeners for actions
      card.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openBirdModal(bird.id);
      });

      card.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteBird(bird.id);
      });

      birdsGridContainer.appendChild(card);
    });

    lucide.createIcons();
  }

  // Modal open
  addBirdBtn.addEventListener('click', () => openBirdModal());
  closeModelBtn.addEventListener('click', closeBirdModal);
  cancelModalBtn.addEventListener('click', closeBirdModal);
  
  function openBirdModal(id = null) {
    birdForm.reset();
    editingBirdId = id;
    
    if (id) {
      modalTitle.textContent = '도감 새 정보 수정';
      const bird = birds.find(b => b.id === id);
      if (bird) {
        document.getElementById('bird-id').value = bird.id;
        document.getElementById('bird-eng-name').value = bird.englishName;
        document.getElementById('bird-maori-name').value = bird.maoriName || '';
        document.getElementById('bird-sci-name').value = bird.scientificName || '';
        document.getElementById('bird-size').value = bird.size || '';
        document.getElementById('bird-korean-name').value = bird.koreanName || '';
        document.getElementById('bird-desc').value = bird.description;
        document.getElementById('bird-habitat').value = bird.habitat || '';
        document.getElementById('bird-behavior').value = bird.behavior || '';
        document.getElementById('bird-source').value = bird.sourceBookPage || '';
      }
    } else {
      modalTitle.textContent = '새로운 도감 새 등록';
      document.getElementById('bird-id').value = '';
    }
    
    birdModal.classList.add('active');
  }

  function closeBirdModal() {
    birdModal.classList.remove('active');
    editingBirdId = null;
  }

  // Form submit (Add / Update)
  birdForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('bird-id').value || 'nz-bird-' + Date.now();
    const englishName = document.getElementById('bird-eng-name').value.trim();
    const maoriName = document.getElementById('bird-maori-name').value.trim();
    const scientificName = document.getElementById('bird-sci-name').value.trim();
    const size = document.getElementById('bird-size').value.trim();
    const koreanName = document.getElementById('bird-korean-name').value.trim();
    const description = document.getElementById('bird-desc').value.trim();
    const habitat = document.getElementById('bird-habitat').value.trim();
    const behavior = document.getElementById('bird-behavior').value.trim();
    const sourceBookPage = document.getElementById('bird-source').value.trim();

    const birdData = {
      id,
      englishName,
      maoriName,
      scientificName,
      size,
      koreanName: koreanName || '공식 한국어 이름 없음',
      description,
      habitat,
      behavior,
      sourceBookPage: sourceBookPage || '나의 도감'
    };

    if (editingBirdId) {
      // Update
      const index = birds.findIndex(b => b.id === editingBirdId);
      if (index !== -1) {
        birds[index] = birdData;
      }
    } else {
      // Add
      birds.push(birdData);
    }

    saveToStorage();
    updateBookUI();
    closeBirdModal();
  });

  // Delete bird
  function deleteBird(id) {
    const bird = birds.find(b => b.id === id);
    if (!bird) return;

    if (confirm(`'${bird.englishName}' 새 정보를 도감에서 삭제하시겠습니까?`)) {
      birds = birds.filter(b => b.id !== id);
      saveToStorage();
      updateBookUI();
    }
  }

  // Export JSON
  exportBtn.addEventListener('click', () => {
    if (birds.length === 0) {
      alert('보낼 도감 데이터가 없습니다.');
      return;
    }
    const dataStr = JSON.stringify(birds, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `nz-birds-mybook-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Import JSON
  importBtn.addEventListener('click', () => {
    importInput.click();
  });

  importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const importedData = JSON.parse(evt.target.result);
        
        if (!Array.isArray(importedData)) {
          throw new Error('데이터 형식이 올바르지 않습니다 (배열 필요).');
        }

        // Validate structure briefly
        const isValid = importedData.every(b => b.englishName && b.description);
        if (!isValid) {
          throw new Error('필수 정보(영어 이름, 묘사)가 유실된 항목이 있습니다.');
        }

        if (confirm(`가져온 ${importedData.length}종의 데이터를 현재 도감에 병합(또는 덮어쓰기)하시겠습니까?\n취소를 누르시면 데이터가 병합되며, 중복된 ID는 덮어씌워집니다.`)) {
          // Merge logic
          importedData.forEach(importedBird => {
            const index = birds.findIndex(b => b.id === importedBird.id || b.englishName.toLowerCase() === importedBird.englishName.toLowerCase());
            if (index !== -1) {
              birds[index] = { ...birds[index], ...importedBird };
            } else {
              birds.push(importedBird);
            }
          });
        } else {
          // Simply merge anyway or just let them cancel import
          return;
        }

        saveToStorage();
        updateBookUI();
        alert('도감 데이터를 가져왔습니다!');
      } catch (err) {
        alert(`가져오기 실패: ${err.message}`);
      }
      importInput.value = ''; // Reset input
    };
    reader.readAsText(file);
  });

  // --- Image Upload Handlers ---
  
  // Drag & drop highlight
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    }, false);
  });

  // Handle drop
  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleImageFiles(files);
  });

  // Handle click to upload
  dropZone.addEventListener('click', (e) => {
    if (e.target !== removeImageBtn && !removeImageBtn.contains(e.target)) {
      imageInput.click();
    }
  });

  imageInput.addEventListener('change', (e) => {
    handleImageFiles(e.target.files);
  });

  function handleImageFiles(files) {
    if (files.length === 0) return;
    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    currentImageMimeType = file.type;

    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Data = e.target.result;
      imagePreview.src = base64Data;
      
      // Store raw Base64 data (strip prefix: data:image/jpeg;base64,)
      currentImageBase64 = base64Data.split(',')[1];
      
      uploadPrompt.classList.add('hidden');
      uploadPreviewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  removeImageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearUploadedImage();
  });

  function clearUploadedImage() {
    imageInput.value = '';
    imagePreview.src = '';
    currentImageBase64 = null;
    currentImageMimeType = null;
    uploadPreviewContainer.classList.add('hidden');
    uploadPrompt.classList.remove('hidden');
  }

  // --- Finder (Search) Logic ---
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const desc = descInput.value.trim();
    
    if (!currentImageBase64 && !desc) {
      alert('새 사진을 올리거나 인상착의 설명을 작성해 주세요.');
      return;
    }

    // Check API Key
    const apiKey = localStorage.getItem('nz_birds_api_key');
    if (!apiKey) {
      alert('설정(Settings) 탭에서 Gemini API Key를 먼저 설정해 주세요.');
      
      // Move to settings tab
      const settingsTabBtn = document.querySelector('.tab-btn[data-tab="settings"]');
      if (settingsTabBtn) settingsTabBtn.click();
      return;
    }

    const model = localStorage.getItem('nz_birds_model') || 'gemini-2.5-flash';

    // Show Loading
    resultEmptyState.classList.add('hidden');
    resultContentArea.classList.add('hidden');
    resultLoaderState.classList.remove('hidden');
    
    searchSubmitBtn.disabled = true;
    const originalBtnHTML = searchSubmitBtn.innerHTML;
    searchSubmitBtn.innerHTML = '<i data-lucide="loader" class="animate-spin"></i><span>AI 분석 중...</span>';
    lucide.createIcons();

    try {
      const aiResult = await queryGeminiAPI(apiKey, model, desc, currentImageBase64, currentImageMimeType);
      renderSearchResult(aiResult);
    } catch (err) {
      console.error(err);
      alert(`AI 분석 중 에러가 발생했습니다: ${err.message}`);
      
      resultLoaderState.classList.add('hidden');
      resultEmptyState.classList.remove('hidden');
    } finally {
      searchSubmitBtn.disabled = false;
      searchSubmitBtn.innerHTML = originalBtnHTML;
      lucide.createIcons();
    }
  });

  // Render Search Results
  function renderSearchResult(data) {
    resultLoaderState.classList.add('hidden');
    resultContentArea.classList.remove('hidden');

    // Badges panel
    resultBadgePanel.innerHTML = '';
    if (data.matchedInBook) {
      resultBadgePanel.innerHTML += `
        <span class="badge badge-book">
          <i data-lucide="check-circle-2"></i> 도감 일치 (${data.confidence}%)
        </span>
      `;
    } else {
      resultBadgePanel.innerHTML += `
        <span class="badge badge-web">
          <i data-lucide="globe"></i> 웹 검색 식별 (${data.confidence}%)
        </span>
      `;
    }
    resultBadgePanel.innerHTML += `
      <span class="badge badge-confidence">
        일치도: ${data.confidence}%
      </span>
    `;

    // Korean Name Check
    const hasKo = data.koreanName && data.koreanName.trim() !== '' && data.koreanName !== '공식 한국어 이름 없음';
    
    // Names
    if (hasKo) {
      resEngName.textContent = `${data.koreanName} (${data.englishName})`;
    } else {
      resEngName.textContent = data.englishName;
    }
    resMaoriName.textContent = data.maoriName ? `(${data.maoriName})` : '';
    resSciName.textContent = data.scientificName || '학명 미상';
    
    // Korean Name Box
    resKoreanName.textContent = hasKo ? data.koreanName : '공식 한국어 이름 없음';
    if (hasKo) {
      resKoreanBox.style.border = '1px solid var(--accent)';
      resKoreanName.style.color = 'var(--accent)';
    } else {
      resKoreanBox.style.border = '1px solid var(--border-color)';
      resKoreanName.style.color = 'var(--text-muted)';
    }

    // Detail texts
    resDescription.textContent = data.description || '특징 설명 없음';
    resHabitat.textContent = data.habitat || '서식지 정보 없음';
    resBehavior.textContent = data.behavior || '행동 정보 없음';

    // Book Source reference
    if (data.matchedInBook && data.matchedId) {
      resBookReference.classList.remove('hidden');
      const matchedBird = birds.find(b => b.id === data.matchedId);
      resBookSource.textContent = matchedBird && matchedBird.sourceBookPage ? matchedBird.sourceBookPage : '나의 도감 p.xx';
    } else {
      resBookReference.classList.add('hidden');
    }

    // AI Web Supplement Info
    if (data.webInfo && data.webInfo.trim() !== '') {
      resAiSupplement.classList.remove('hidden');
      resWebInfo.textContent = data.webInfo;
    } else {
      resAiSupplement.classList.add('hidden');
    }

    // Update External Links
    if (linkNzBirdsOnline && linkWikipedia) {
      linkNzBirdsOnline.href = `https://www.google.com/search?q=${encodeURIComponent('site:nzbirdsonline.org.nz ' + data.englishName)}`;
      linkWikipedia.href = `https://ko.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(hasKo ? data.koreanName : data.englishName)}`;
    }

    // Fetch live photos & sightings from iNaturalist & eBird APIs
    if (data.scientificName) {
      loadINaturalistPhotos(data.scientificName);
    } else {
      document.getElementById('res-inaturalist').classList.add('hidden');
    }

    if (data.ebirdSpeciesCode) {
      loadEBirdSightings(data.ebirdSpeciesCode);
    } else {
      document.getElementById('res-ebird').classList.add('hidden');
    }

    lucide.createIcons();
  }

  // --- API Communications ---

  // Connection Test
  async function testGeminiAPI(apiKey, model) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello, reply with 1 word 'OK'." }] }]
        })
      });
      return response.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  // Query API with parameters
  async function queryGeminiAPI(apiKey, model, desc, imageBase64, mimeType) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // System instructions for birds identifier agent
    const systemPrompt = `You are a professional ornithologist specializing in New Zealand birds.
Your task is to identify a bird based on a physical description and/or an image.

Here is the database of birds that the user has recorded from their book:
${JSON.stringify(birds, null, 2)}

Identify the bird by following these instructions:
1. Compare the description/image with the user's book database FIRST. If there is a match (even if named slightly differently or description is partial), identify it as that bird, set "matchedInBook" to true, and set "matchedId" to that bird's ID from the database.
2. If it is NOT in the database, identify it using your general knowledge of New Zealand birds. Set "matchedInBook" to false and leave "matchedId" empty.
3. Find the official, biological Korean name for this bird.
   CRITICAL RULE for Korean name: DO NOT translate the name literally (e.g. translating 'Morepork' as '더 많은 돼지고기' or 'Bellbird' as '종새' is strictly forbidden). Only provide the Korean name if there is an officially recognized Korean biological name or widely accepted common name in Korea (e.g. '부채꼬리딱새' for Fantail, '케아' for Kea, '투이' for Tui, '자색쇠물닭' for Pukeko). If there is NO official Korean name, set "koreanName" to "공식 한국어 이름 없음".
4. "confidence" should be an integer between 0 and 100 indicating your confidence in the match.
5. Provide the physical description, habitat, and behavior of this bird. All text explanations (description, habitat, behavior) MUST be written in Korean.
6. Provide additional helpful internet information in "webInfo" (especially interesting facts about the bird, how common it is, where to see it in New Zealand). If the bird was NOT found in the user's book, explain why it's not in their book and details about it. The "webInfo" and "bookDetails" fields MUST be written in Korean.
7. Provide the standard 6-character eBird species code in "ebirdSpeciesCode" (e.g. 'fantai1' for Fantail, 'tui1' for Tui, 'kea1' for Kea, 'pukeko1' for Pukeko, 'kakapo1' for Kakapo). If you don't know the code, make a best guess, or leave it blank if unknown.
8. Return a valid JSON object matching the required schema. Ensure it is valid JSON. All text details and descriptions in the JSON response must be strictly in Korean.`;

    const userPromptText = `User observation:
- Description from user: "${desc || 'No text description provided, only image.'}"
Analyze the image (if provided) and description to identify the New Zealand bird.`;

    const contentsPart = {
      parts: [
        { text: `${systemPrompt}\n\n${userPromptText}` }
      ]
    };

    if (imageBase64 && mimeType) {
      contentsPart.parts.push({
        inlineData: {
          mimeType: mimeType,
          data: imageBase64
        }
      });
    }

    const responseSchema = {
      type: "OBJECT",
      properties: {
        matchedInBook: { type: "BOOLEAN", description: "Whether this matches a bird in the user's book database." },
        matchedId: { type: "STRING", description: "The ID of the matched bird from the book database, or empty if not matched." },
        englishName: { type: "STRING", description: "English name of the bird." },
        maoriName: { type: "STRING", description: "Māori name of the bird if known." },
        scientificName: { type: "STRING", description: "Scientific biological name of the bird." },
        koreanName: { type: "STRING", description: "Official Korean name or '공식 한국어 이름 없음'." },
        ebirdSpeciesCode: { type: "STRING", description: "The standard eBird species code (e.g., 'tui1', 'kea1', 'fantai1'). Leave empty if unknown." },
        confidence: { type: "INTEGER", description: "Confidence score 0-100." },
        description: { type: "STRING", description: "Physical description of the bird." },
        habitat: { type: "STRING", description: "Habitat of the bird." },
        behavior: { type: "STRING", description: "Typical behavior patterns." },
        bookDetails: { type: "STRING", description: "Summarized book details or empty if not matched in book." },
        webInfo: { type: "STRING", description: "AI supplement internet information and notes." }
      },
      required: ["matchedInBook", "matchedId", "englishName", "maoriName", "scientificName", "koreanName", "ebirdSpeciesCode", "confidence", "description", "habitat", "behavior", "bookDetails", "webInfo"]
    };

    const requestBody = {
      contents: [contentsPart],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API returned status ${response.status}: ${errText}`);
    }

    const resJson = await response.json();
    
    // Parse the generated text response, which is a JSON string
    if (resJson.candidates && resJson.candidates[0] && resJson.candidates[0].content && resJson.candidates[0].content.parts[0]) {
      const responseText = resJson.candidates[0].content.parts[0].text;
      return JSON.parse(responseText);
    } else {
      throw new Error("Invalid response format received from Gemini API.");
    }
  }

  // --- External API Call Integrations ---

  // Fetch photos from iNaturalist
  async function loadINaturalistPhotos(scientificName) {
    const galleryContainer = document.getElementById('res-inaturalist-gallery');
    const section = document.getElementById('res-inaturalist');
    galleryContainer.innerHTML = '<p class="loader-status-text">iNaturalist에서 사진을 로드하는 중...</p>';
    section.classList.remove('hidden');

    try {
      // Find taxon by scientific name
      const response = await fetch(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(scientificName)}&taxon_id=3`);
      if (!response.ok) throw new Error("iNaturalist 종 검색 실패");
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const taxon = data.results[0];
        
        // Fetch observations with photos for this taxon
        const responseObs = await fetch(`https://api.inaturalist.org/v1/observations?taxon_id=${taxon.id}&photos=true&per_page=4`);
        if (!responseObs.ok) throw new Error("iNaturalist 관찰 데이터 검색 실패");
        const obsData = await responseObs.json();
        
        galleryContainer.innerHTML = '';
        if (obsData.results && obsData.results.length > 0) {
          obsData.results.forEach(obs => {
            if (obs.photos && obs.photos.length > 0) {
              const photo = obs.photos[0];
              const imgUrl = photo.url.replace('square.', 'medium.');
              
              const imgContainer = document.createElement('div');
              imgContainer.className = 'inaturalist-img-container';
              imgContainer.innerHTML = `<img src="${imgUrl}" alt="${scientificName}" title="iNaturalist 관찰 사진 (클릭하여 크게 보기)">`;
              
              // Open native observation page on click
              imgContainer.addEventListener('click', () => {
                window.open(obs.uri || photo.native_page_url || imgUrl, '_blank');
              });
              
              galleryContainer.appendChild(imgContainer);
            }
          });
        } else if (taxon.default_photo && taxon.default_photo.medium_url) {
          const imgContainer = document.createElement('div');
          imgContainer.className = 'inaturalist-img-container';
          imgContainer.innerHTML = `<img src="${taxon.default_photo.medium_url}" alt="${scientificName}">`;
          imgContainer.addEventListener('click', () => {
            window.open(taxon.default_photo.native_page_url || taxon.default_photo.medium_url, '_blank');
          });
          galleryContainer.appendChild(imgContainer);
        } else {
          galleryContainer.innerHTML = '<p class="loader-status-text">사용 가능한 실시간 사진이 없습니다.</p>';
        }
      } else {
        galleryContainer.innerHTML = '<p class="loader-status-text">iNaturalist에서 종을 식별하지 못했습니다.</p>';
      }
    } catch (err) {
      console.error('Error fetching iNaturalist photos:', err);
      galleryContainer.innerHTML = `<p class="loader-status-text" style="color: var(--danger);">사진 로딩 실패: ${err.message}</p>`;
    }
  }

  // Fetch recent sightings from eBird
  async function loadEBirdSightings(ebirdSpeciesCode) {
    const sightingsList = document.getElementById('res-ebird-sightings');
    const section = document.getElementById('res-ebird');
    
    // Check if token exists and is not empty
    const ebirdToken = localStorage.getItem('nz_birds_ebird_token');
    if (!ebirdToken || ebirdToken.trim() === '') {
      section.classList.add('hidden'); // Hide sightings panel if eBird token is not configured
      return;
    }

    if (!ebirdSpeciesCode || ebirdSpeciesCode.trim() === '') {
      section.classList.add('hidden');
      return;
    }

    sightingsList.innerHTML = '<li class="ebird-sighting-item">eBird에서 뉴질랜드 최근 관찰 정보를 가져오는 중...</li>';
    section.classList.remove('hidden');

    try {
      // Recent observations of a species in New Zealand (NZ), limit to 5
      const response = await fetch(`https://api.ebird.org/v2/data/obs/NZ/recent/${ebirdSpeciesCode}?maxResults=5`, {
        headers: {
          'X-eBirdApiToken': ebirdToken
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("유효하지 않은 eBird 토큰입니다.");
        } else if (response.status === 400 || response.status === 404) {
          throw new Error(`올바르지 않은 eBird 종 코드 (${ebirdSpeciesCode})`);
        } else {
          throw new Error(`API 오류 (상태 코드: ${response.status})`);
        }
      }
      const data = await response.json();

      sightingsList.innerHTML = '';
      if (data && data.length > 0) {
        data.forEach(obs => {
          const li = document.createElement('li');
          li.className = 'ebird-sighting-item';
          
          const date = new Date(obs.obsDt);
          const formattedDate = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          
          li.innerHTML = `
            <span class="sighting-loc" title="${obs.locName}">
              <i data-lucide="map-pin"></i>
              ${obs.locName}
            </span>
            <div class="sighting-meta">
              <span>${formattedDate}</span>
              <span class="sighting-count">${obs.howMany || 1}마리</span>
            </div>
          `;
          sightingsList.appendChild(li);
        });
      } else {
        sightingsList.innerHTML = '<li class="ebird-sighting-item" style="color: var(--text-muted);">최근 30일간 뉴질랜드 내 공식 관측 보고가 없습니다.</li>';
      }
      lucide.createIcons();
    } catch (err) {
      console.error('Error fetching eBird sightings:', err);
      sightingsList.innerHTML = `<li class="ebird-sighting-item" style="color: var(--danger);">관측지 조회 실패: ${err.message}</li>`;
    }
  }

});
