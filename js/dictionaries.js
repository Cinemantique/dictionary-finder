// Отображение словарей, сгруппированных по типам

function showDictionaries(ids, word = null, onBack = null) {
    const details = document.getElementById("details");
    details.innerHTML = "";

    if (word !== null) {
        const title = document.createElement("h2");
        title.className = "detail-title";
        title.textContent = word;
        details.appendChild(title);
    }

    if (onBack) {
        const back = document.createElement("button");
        back.className = "back-button";
        back.textContent = "← Назад к результатам";
        back.addEventListener("click", onBack);
        details.appendChild(back);
    }

    const grouped = {};

    for (const id of [...new Set(ids)]) {
        const dictionary = dictionaries[id];
        if (!dictionary) continue;

        for (const typeId of dictionary.types) {
            if (!grouped[typeId]) {
                grouped[typeId] = [];
            }

            grouped[typeId].push(dictionary);
        }
    }

    renderGroups(grouped, details, false, word);
}


// Отображение групп словарей

function renderGroups(grouped, container, catalogMode, word = null) {
    for (const typeId of Object.keys(grouped).sort()) {
        const section = document.createElement("section");
        section.className = "group";

        // Заголовок группы и количество словарей
        const heading = document.createElement("h2");

        const headingName = document.createElement("span");
        headingName.textContent = types[typeId]?.name || typeId;

        const headingCount = document.createElement("span");
        headingCount.textContent = grouped[typeId].length;

        heading.appendChild(headingName);
        heading.appendChild(headingCount);

        section.appendChild(heading);

        grouped[typeId].sort((a, b) =>
            a.name.localeCompare(b.name, "ru")
        );

        for (const dictionary of grouped[typeId]) {
            const item = document.createElement("div");
            item.className = "dictionary";

            const titleRow = document.createElement("div");
            titleRow.className = "dictionary-title-row";

            // Название словаря
            const button = document.createElement("button");
            button.className = "dictionary-button";
            button.textContent = dictionary.name;

            button.addEventListener("click", () => {
                showDictionaryDetails(dictionary.id, catalogMode);
            });

            titleRow.appendChild(button);

            // Год издания
            if (dictionary.year) {
                const year = document.createElement("span");
                year.className = "dictionary-meta";
                year.textContent = dictionary.year;
                titleRow.appendChild(year);
            }

            // Внешняя ссылка на поиск слова
            if (word !== null && dictionary.search_url) {
                const searchLink = document.createElement("a");
                searchLink.className = "dictionary-search-link";

                const encodedWord = encodeURIComponent(word);

                const url = dictionary.search_url
                    .replaceAll("[first]", encodeURIComponent(word[0]))
                    .replaceAll("[word]", encodedWord);

                searchLink.href = url;
                searchLink.target = "_blank";
                searchLink.rel = "noopener noreferrer";
                searchLink.textContent = "Открыть →";

                titleRow.appendChild(searchLink);
            }

            item.appendChild(titleRow);
            section.appendChild(item);
        }

        container.appendChild(section);
    }
}


// Карточка словаря

function showDictionaryDetails(id, catalogMode) {
    const dictionary = dictionaries[id];
    if (!dictionary) return;

    const container = document.getElementById(
        catalogMode ? "catalog" : "details"
    );

    // Сохраняем прежнее содержимое вместе с обработчиками событий
    const previousContent = document.createDocumentFragment();

    while (container.firstChild) {
        previousContent.appendChild(container.firstChild);
    }

    const back = document.createElement("button");
    back.className = "back-button";
    back.textContent = "← Назад";

    back.addEventListener("click", () => {
        container.innerHTML = "";
        container.appendChild(previousContent);
    });

    container.appendChild(back);

    const title = document.createElement("h2");
    title.className = "detail-title";
    title.textContent = dictionary.name;
    container.appendChild(title);

    function addRow(label, value) {
        if (value === null || value === undefined || value === "") {
            return;
        }

        const row = document.createElement("div");
        row.className = "detail-row";

        const labelElement = document.createElement("div");
        labelElement.className = "detail-label";
        labelElement.textContent = label;

        const valueElement = document.createElement("div");
        valueElement.textContent = value;
        valueElement.style.whiteSpace = "pre-line";

        row.appendChild(labelElement);
        row.appendChild(valueElement);
        container.appendChild(row);
    }

    addRow("Автор", dictionary.author);
    addRow("Год издания", dictionary.year);

    addRow(
        "Количество слов",
        dictionary.word_count?.toLocaleString("ru-RU")
    );

    addRow("Описание", dictionary.description);

    addRow(
        "Типы",
        dictionary.types.map(typeId =>
            types[typeId]?.name || typeId
        ).join(", ")
    );

    if (dictionary.url) {
        const row = document.createElement("div");
        row.className = "detail-row";

        const link = document.createElement("a");
        link.href = dictionary.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Открыть источник";

        row.appendChild(link);
        container.appendChild(row);
    }
}