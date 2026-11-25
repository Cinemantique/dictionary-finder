const RESULTS_PER_PAGE = 100;
const results = document.getElementById("results");
const details = document.getElementById("details");
const searchStatus = document.getElementById("status");
let searchVersion = 0;

async function search() {
    const query = document.getElementById("word").value.trim();
    const regex = document.getElementById("regex").checked;
    const distinguishYo = document.getElementById("yo").checked;

    searchVersion++;
    results.replaceChildren();
    details.replaceChildren();
    details.classList.add("hidden");
    results.classList.remove("hidden");

    if (!query) {
        searchStatus.textContent = "Введите поисковый запрос.";
        return;
    }

    await showMatchPage({ query, regex, distinguishYo }, 1);
}

async function showMatchPage(query, page) {
    const version = ++searchVersion;
    searchStatus.textContent = "Поиск по словникам…";
    try {
        const result = await requestSearch("page", { ...query, page, pageSize: RESULTS_PER_PAGE });
        if (version === searchVersion) renderSearchResults(result, query, page);
    } catch (error) {
        if (version === searchVersion) searchStatus.textContent = error.message;
    }
}

async function openWord(word, distinguishYo, dictionaryIds) {
    const version = ++searchVersion;
    try {
        const ids = dictionaryIds ?? await requestSearch("lookup", { word, distinguishYo });
        if (version !== searchVersion) return;
        if (!ids.length) {
            searchStatus.textContent = "Слово не найдено.";
            return;
        }
        await loadCatalog();
        if (version !== searchVersion) return;

        details.classList.remove("hidden");
        results.classList.add("hidden");
        showDictionaries(ids, word, () => {
            details.classList.add("hidden");
            results.classList.remove("hidden");
        });
    } catch (error) {
        if (version === searchVersion) searchStatus.textContent = error.message;
    }
}

function renderSearchResults({ entries, total }, query, page) {
    results.replaceChildren();
    if (!total) {
        searchStatus.textContent = "Совпадений не найдено.";
        return;
    }

    const pages = Math.ceil(total / RESULTS_PER_PAGE);
    searchStatus.textContent = "Найдено слов: " + total.toLocaleString("ru-RU") +
        " · Страница " + page + " из " + pages;

    const list = document.createElement("div");
    list.className = "word-list";
    for (const [word, dictionaryCount, dictionaryIds] of entries) {
        const row = document.createElement("div");
        row.className = "word-item";

        const button = document.createElement("button");
        button.textContent = word;
        button.addEventListener("click", () => void openWord(word, query.distinguishYo, dictionaryIds));

        const count = document.createElement("span");
        count.className = "word-count";
        count.textContent = "словарей: " + dictionaryCount;

        row.append(button, count);
        list.append(row);
    }
    results.append(list);

    const pagination = document.createElement("div");
    pagination.className = "pagination";

    const previous = document.createElement("button");
    previous.textContent = "← Назад";
    previous.disabled = page === 1;
    previous.addEventListener("click", () => void showMatchPage(query, page - 1));

    const pageInfo = document.createElement("span");
    pageInfo.textContent = page + " / " + pages;

    const next = document.createElement("button");
    next.textContent = "Вперёд →";
    next.disabled = page === pages;
    next.addEventListener("click", () => void showMatchPage(query, page + 1));

    pagination.append(previous, pageInfo, next);
    results.append(pagination);
}
