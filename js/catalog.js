// Каталог словарей

function showCatalog() {
    const catalog = document.getElementById("catalog");

    const query = document.getElementById("catalog-search")
        .value.trim().toLowerCase();

    const selectedType = document.getElementById("catalog-type").value;

    catalog.innerHTML = "";

    const grouped = {};
    let filteredCount = 0;

    for (const dictionary of Object.values(dictionaries)) {
        const searchableText = [
            dictionary.name,
            dictionary.author,
            dictionary.description,
            dictionary.year
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        if (query && !searchableText.includes(query)) continue;

        if (
            selectedType &&
            !dictionary.types.includes(selectedType)
        ) {
            continue;
        }

        filteredCount++;

        for (const typeId of dictionary.types) {
            if (selectedType && typeId !== selectedType) continue;

            if (!grouped[typeId]) {
                grouped[typeId] = [];
            }

            grouped[typeId].push(dictionary);
        }
    }

    document.getElementById("catalog-status").textContent =
        "Найдено словарей: " +
        filteredCount.toLocaleString("ru-RU");

    renderGroups(grouped, catalog, true);
}