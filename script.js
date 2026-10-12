// ===== Настройки =====
const API_KEY = "9714615b026618852258a19fe106562e";
const API_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w200";
const NO_POSTER = "https://placehold.co/200x300/1a1a1a/ffffff?text=No+poster";

// ===== Элементы страницы =====
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const resultsContainer = document.querySelector(".movies-grid");

// Экранирует символы, чтобы название с кавычками не ломало HTML
function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Показывает сообщение вместо результатов
function showMessage(html) {
  resultsContainer.innerHTML = `
    <div style="color: white; padding: 40px; text-align: center; width: 100%;">
      ${html}
    </div>`;
}

// Создаёт карточку фильма или сериала
function createCard(item) {
  const isMovie = item.media_type === "movie";
  const title = escapeHtml(isMovie ? item.title : item.name) || "Без названия";
  const date = isMovie ? item.release_date : item.first_air_date;
  const year = date ? date.substring(0, 4) : "—";
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "0";
  const overview = escapeHtml((item.overview || "Описание отсутствует").substring(0, 120));
  const poster = item.poster_path ? IMAGE_URL + item.poster_path : NO_POSTER;

  const card = document.createElement("div");
  card.className = "movie-card";
  card.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; color: white; padding: 10px; background: #1a1a1a; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); width: 200px; min-height: 350px;">
      <img src="${poster}" alt="${title}" style="width: 100%; max-width: 200px; border-radius: 8px;">
      <h3 style="margin: 8px 0 4px; font-size: 16px;">${title}</h3>
      <p style="margin: 0; font-size: 14px; color: #aaa;">Год: ${year} | ⭐ ${rating}</p>
      <p style="margin: 4px 0 0; font-size: 12px; color: #888; text-align: center;">${overview}...</p>
    </div>`;
  return card;
}

// Главная функция поиска: по названию или по IMDb ID (например tt0232500)
async function searchTitles() {
  const query = searchInput.value.trim();
  if (!query) return;

  showMessage("<p>⏳ Ищем...</p>");

  const isImdbId = /^tt\d+$/i.test(query);

  try {
    let url;
    if (isImdbId) {
      // Поиск по IMDb ID: TMDB возвращает фильмы и сериалы в отдельных списках
      url = `${API_URL}/find/${query.toLowerCase()}?api_key=${API_KEY}&language=ru-RU&external_source=imdb_id`;
    } else {
      // Поиск по названию: фильмы и сериалы приходят в одном списке
      url = `${API_URL}/search/multi?api_key=${API_KEY}&language=ru-RU&query=${encodeURIComponent(query)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      // TMDB пишет причину ошибки в поле status_message
      const info = await response.json().catch(() => ({}));
      throw new Error(`Код ${response.status}: ${info.status_message || "неизвестная ошибка"}`);
    }

    const data = await response.json();
    let items;

    if (isImdbId) {
      // Добавляем media_type вручную, чтобы карточка знала, фильм это или сериал
      const movies = (data.movie_results || []).map((m) => ({ ...m, media_type: "movie" }));
      const series = (data.tv_results || []).map((t) => ({ ...t, media_type: "tv" }));
      items = [...movies, ...series];
    } else {
      // Оставляем только фильмы и сериалы, актёры нам не нужны
      items = (data.results || []).filter(
        (item) => item.media_type === "movie" || item.media_type === "tv"
      );
    }

    if (items.length === 0) {
      showMessage("<h3>😕 Ничего не найдено</h3><p>Попробуйте другое название или ID</p>");
      return;
    }

    resultsContainer.innerHTML = "";
    items.forEach((item) => resultsContainer.appendChild(createCard(item)));
  } catch (error) {
    console.error("❌ Ошибка:", error);
    let text = error.message;
    if (error.message === "Failed to fetch") {
      text = "Нет ответа от TMDB: проверьте интернет, VPN или блокировку провайдера";
    }
    showMessage(`<h3 style="color: red;">⚠️ Ошибка загрузки данных</h3><p>${escapeHtml(text)}</p>`);
  }
}

// ===== Запуск поиска =====
// Кнопка «Найти» работает всегда, и на телефоне, и на ПК
searchButton.addEventListener("click", searchTitles);

// Enter в поле поиска
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchTitles();
});

// Подсказка при открытии страницы
showMessage("<p>Введите название фильма или дорамы, либо IMDb ID (например tt0232500)</p>");

// ===== Боковое меню =====
const menuBtn = document.getElementById("menu-btn");
const closeBtn = document.getElementById("close-btn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebar-overlay");

function openMenu() {
  sidebar.classList.add("active");
  overlay.classList.add("active");
}

function closeMenu() {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
}

if (menuBtn) menuBtn.addEventListener("click", openMenu);
if (closeBtn) closeBtn.addEventListener("click", closeMenu);
if (overlay) overlay.addEventListener("click", closeMenu);
