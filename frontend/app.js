let accessToken = localStorage.getItem('accessToken');
const API_URL = window.location.origin;

const loginModal = document.getElementById('loginModal');
const searchInterface = document.getElementById('searchInterface');
const userInfo = document.getElementById('userInfo');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const submitLoginBtn = document.getElementById('submitLoginBtn');
const tokenInput = document.getElementById('tokenInput');
const loginError = document.getElementById('loginError');

if (accessToken) {
  showSearchInterface();
} else {
  showLoginModal();
}

loginBtn.addEventListener('click', () => {
  showLoginModal();
  tokenInput.focus();
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('accessToken');
  accessToken = null;
  tokenInput.value = '';
  loginError.textContent = '';
  showLoginModal();
});

submitLoginBtn.addEventListener('click', async () => {
  const token = tokenInput.value.trim();
  if (!token) {
    loginError.textContent = '⚠️ Token obrigatório';
    return;
  }

  submitLoginBtn.disabled = true;
  submitLoginBtn.textContent = 'Conectando...';

  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      throw new Error('Token inválido');
    }

    const data = await response.json();
    accessToken = data.accessToken;
    localStorage.setItem('accessToken', accessToken);
    
    showSearchInterface();
    loginError.textContent = '';
    tokenInput.value = '';

  } catch (error) {
    loginError.textContent = '❌ ' + error.message;
  } finally {
    submitLoginBtn.disabled = false;
    submitLoginBtn.textContent = 'Conectar';
  }
});

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchBtnText = document.getElementById('searchBtnText');
const searchSpinner = document.getElementById('searchSpinner');
const results = document.getElementById('results');
const noResults = document.getElementById('noResults');
const articlesList = document.getElementById('articlesList');

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') performSearch();
});

async function performSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  searchBtnText.style.display = 'none';
  searchSpinner.style.display = 'inline';
  searchBtn.disabled = true;

  try {
    const response = await fetch(
      `${API_URL}/api/search?q=${encodeURIComponent(query)}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('accessToken');
      accessToken = null;
      showLoginModal();
      return;
    }

    if (!response.ok) throw new Error('Erro ao buscar');

    const data = await response.json();
    displayResults(data);

  } catch (error) {
    noResults.textContent = '❌ Erro: ' + error.message;
    noResults.style.display = 'block';
    articlesList.innerHTML = '';
  } finally {
    searchBtnText.style.display = 'inline';
    searchSpinner.style.display = 'none';
    searchBtn.disabled = false;
  }
}

function displayResults(data) {
  articlesList.innerHTML = '';

  if (data.total === 0) {
    noResults.textContent = `😔 Nenhum resultado para "${data.query}"`;
    noResults.style.display = 'block';
    return;
  }

  noResults.style.display = 'none';

  data.articles.forEach((article, index) => {
    const articleEl = document.createElement('div');
    articleEl.className = 'article-card';
    articleEl.innerHTML = `
      <div class="article-number">${index + 1}</div>
      <div class="article-content">
        <h3>${article.title}</h3>
        <p>${article.content.substring(0, 100)}...</p>
        <a href="${article.url}" target="_blank" class="btn-link">Leia mais →</a>
      </div>
    `;
    articlesList.appendChild(articleEl);
  });
}

function showLoginModal() {
  loginModal.style.display = 'flex';
  searchInterface.style.display = 'none';
  userInfo.style.display = 'none';
  loginBtn.style.display = 'inline-block';
}

function showSearchInterface() {
  loginModal.style.display = 'none';
  searchInterface.style.display = 'block';
  userInfo.style.display = 'inline-block';
  loginBtn.style.display = 'none';
  searchInput.focus();
}
