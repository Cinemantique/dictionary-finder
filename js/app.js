// Общие данные приложения

let index = {};
let normalizedIndex = {};
let words = [];
let dictionaries = {};
let types = {};


// Загрузка данных

async function loadData() {
    try {
        const [i, n, w, d, t] = await Promise.all([
            fetch("data/index.json"),
            fetch("data/normalized_index.json"),
            fetch("data/words.json"),
            fetch("data/dictionaries.json"),
            fetch("data/types.json")
        ]);

        if (![i, n, w, d, t].every(response => response.ok)) {
            throw new Error("Не удалось загрузить данные");
        }

        [index, normalizedIndex, words, dictionaries, types] =
            await Promise.all([
                i.json(),
                n.json(),
                w.json(),
                d.json(),
                t.json()
            ]);

        document.getElementById("status").textContent =
            "Данные загружены. Слов в индексе: " +
            words.length.toLocaleString("ru-RU");

        document.getElementById("catalog-status").textContent =
            "Словарей в каталоге: " +
            Object.keys(dictionaries).length.toLocaleString("ru-RU");

        const typeSelect = document.getElementById("catalog-type");

        for (const typeId of Object.keys(types).sort()) {
            const option = document.createElement("option");
            option.value = typeId;
            option.textContent = types[typeId].name;
            typeSelect.appendChild(option);
        }

        showCatalog();

    } catch (error) {
        document.getElementById("status").textContent =
            "Ошибка загрузки данных: " + error.message;
    }
}


// Переключение вкладок

function showPage(page) {
    document.getElementById("search-page").classList.toggle(
        "hidden", page !== "search"
    );

    document.getElementById("catalog-page").classList.toggle(
        "hidden", page !== "catalog"
    );

    document.getElementById("tab-search").classList.toggle(
        "active", page === "search"
    );

    document.getElementById("tab-catalog").classList.toggle(
        "active", page === "catalog"
    );
}


// Обработчики событий

document.getElementById("tab-search").addEventListener(
    "click", () => showPage("search")
);

document.getElementById("tab-catalog").addEventListener(
    "click", () => showPage("catalog")
);

document.getElementById("search").addEventListener("click", search);

document.getElementById("word").addEventListener("keydown", event => {
    if (event.key === "Enter") search();
});

document.getElementById("catalog-search")
    .addEventListener("input", showCatalog);

document.getElementById("catalog-type")
    .addEventListener("change", showCatalog);


// Запуск приложения

loadData();