const RESULTS_PER_PAGE = 100;

let currentMatches = [];
let currentPage = 1;
let currentDistinguishYo = false;


// Поиск

function search() {
    const input = document.getElementById("word").value.trim();
    const useRegex = document.getElementById("regex").checked;
    const distinguishYo = document.getElementById("yo").checked;

    const results = document.getElementById("results");
    const details = document.getElementById("details");
    const status = document.getElementById("status");

    results.innerHTML = "";
    details.innerHTML = "";
    details.classList.add("hidden");
    results.classList.remove("hidden");

    currentMatches = [];
    currentPage = 1;

    if (!input) {
        status.textContent = "Введите поисковый запрос.";
        return;
    }

    const isMask = mode === "normal" && /[*?]/.test(input);

    let regex = null;

    try {
        if (isMask) {
            regex = wildcardToRegex(input, distinguishYo);
        }

        if (mode === "regex") {
            regex = prepareRegex(input, distinguishYo);
        }
    } catch (error) {
        status.textContent =
            "Ошибка в поисковом выражении: " + error.message;
        return;
    }

    // Точное совпадение в обычном режиме
    if (mode === "normal" && !isMask) {
        const ids = getDictionaryIds(
            input.toLowerCase(),
            distinguishYo
        );

        if (!ids.length) {
            status.textContent = "Слово не найдено.";
            return;
        }

        status.textContent = "Найдено словарей: " + ids.length;

        details.classList.remove("hidden");
        showDictionaries(ids, input);
        return;
    }

    // Поиск по маске или регулярному выражению
    const matches = [];

    for (const word of words) {
        regex.lastIndex = 0;

        if (regex.test(word)) {
            matches.push(word);
        }
    }

    if (!matches.length) {
        status.textContent = "Совпадений не найдено.";
        return;
    }

    currentMatches = matches.sort((a, b) =>
        a.localeCompare(b, "ru")
    );

    currentDistinguishYo = distinguishYo;
    currentPage = 1;

    renderSearchResults();
}


// Отображение одной страницы результатов

function renderSearchResults() {
    const results = document.getElementById("results");
    const status = document.getElementById("status");

    results.innerHTML = "";

    const totalPages = Math.ceil(
        currentMatches.length / RESULTS_PER_PAGE
    );

    const start = (currentPage - 1) * RESULTS_PER_PAGE;

    const pageMatches = currentMatches.slice(
        start,
        start + RESULTS_PER_PAGE
    );

    status.textContent =
        "Найдено слов: " +
        currentMatches.length.toLocaleString("ru-RU") +
        " · Страница " + currentPage + " из " + totalPages;

    const list = document.createElement("div");
    list.className = "word-list";

    for (const word of pageMatches) {
        const ids = getDictionaryIds(word, currentDistinguishYo);

        const row = document.createElement("div");
        row.className = "word-item";

        const button = document.createElement("button");
        button.textContent = word;

        button.addEventListener("click", () => {
            const details = document.getElementById("details");

            results.classList.add("hidden");
            details.classList.remove("hidden");

            showDictionaries(ids, word, () => {
                details.classList.add("hidden");
                results.classList.remove("hidden");
            });
        });

        const count = document.createElement("span");
        count.className = "word-count";
        count.textContent = "словарей: " + ids.length;

        row.appendChild(button);
        row.appendChild(count);
        list.appendChild(row);
    }

    results.appendChild(list);

    // Навигация по страницам

    const pagination = document.createElement("div");
    pagination.className = "pagination";

    const previous = document.createElement("button");
    previous.textContent = "← Назад";
    previous.disabled = currentPage === 1;

    previous.addEventListener("click", () => {
        currentPage--;
        renderSearchResults();
    });

    const pageInfo = document.createElement("span");
    pageInfo.textContent = currentPage + " / " + totalPages;

    const next = document.createElement("button");
    next.textContent = "Вперёд →";
    next.disabled = currentPage === totalPages;

    next.addEventListener("click", () => {
        currentPage++;
        renderSearchResults();
    });

    pagination.appendChild(previous);
    pagination.appendChild(pageInfo);
    pagination.appendChild(next);

    results.appendChild(pagination);
}