let dictionaries = {};
let types = {};
let catalogRequest;
let catalogRendered = false;

async function fetchCatalogFile(name) {
    const response = await fetch(`data/${name}.json`);
    if (!response.ok) throw new Error("Не удалось загрузить каталог словарей.");
    return response.json();
}

function loadCatalog() {
    catalogRequest ??= Promise.all([
        fetchCatalogFile("dictionaries"),
        fetchCatalogFile("types"),
    ]).then(([loadedDictionaries, loadedTypes]) => {
        dictionaries = loadedDictionaries;
        types = loadedTypes;
        const select = document.getElementById("catalog-type");
        for (const id of Object.keys(types).sort()) {
            select.add(new Option(types[id].name, id));
        }
    }).catch(error => {
        catalogRequest = undefined;
        throw error;
    });
    return catalogRequest;
}

function countLabel(count, forms) {
    const units = count % 10;
    const tens = count % 100;
    const index = tens >= 11 && tens <= 14 ? 2 : units === 1 ? 0 : units >= 2 && units <= 4 ? 1 : 2;
    return `${count.toLocaleString("ru-RU")} ${forms[index]}`;
}

if (typeof INDEX_SUMMARY !== "undefined") {
    const words = countLabel(INDEX_SUMMARY.wordCount, ["заголовок", "заголовка", "заголовков"]);
    const sources = countLabel(INDEX_SUMMARY.dictionaryCount, ["словарь", "словаря", "словарей"]);
    document.getElementById("index-summary").textContent = `${words} · ${sources}`;
}

async function refreshCatalog() {
    const status = document.getElementById("catalog-status");
    if (!catalogRequest) status.textContent = "Загрузка каталога…";
    try {
        await loadCatalog();
        showCatalog();
        catalogRendered = true;
    } catch (error) {
        status.textContent = error.message;
    }
}

function showPage(page) {
    document.getElementById("search-page").classList.toggle("hidden", page !== "search");
    document.getElementById("catalog-page").classList.toggle("hidden", page !== "catalog");
    document.getElementById("tab-search").classList.toggle("active", page === "search");
    document.getElementById("tab-catalog").classList.toggle("active", page === "catalog");
    if (page === "catalog" && !catalogRendered) void refreshCatalog();
}

document.getElementById("tab-search").addEventListener("click", () => showPage("search"));
document.getElementById("tab-catalog").addEventListener("click", () => showPage("catalog"));
document.getElementById("search").addEventListener("click", search);
document.getElementById("word").addEventListener("keydown", event => {
    if (event.key === "Enter") void search();
});
document.getElementById("catalog-search").addEventListener("input", refreshCatalog);
document.getElementById("catalog-type").addEventListener("change", refreshCatalog);
