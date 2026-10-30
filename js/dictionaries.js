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

    renderGroups(grouped, details, false);
}


// Отображение групп словарей

function renderGroups(grouped, container, catalogMode) {
    for (const typeId of Object.keys(grouped).sort()) {
        const section = document.createElement("section");
        section.className = "group";

        const heading = document.createElement("h2");
        heading.textContent = types[typeId]?.name || typeId;
        section.appendChild(heading);

        grouped[typeId].sort((a, b) =>
            a.name.localeCompare(b.name, "ru")
        );

        for (const dictionary of grouped[typeId]) {
            const item = document.createElement("div");
            item.className = "dictionary";

            const button = document.createElement("button");
            button.className = "dictionary-button";
            button.textContent = dictionary.name;

            button.addEventListener("click", () => {
                showDictionaryDetails(dictionary.id, catalogMode);
            });

            item.appendChild(button);

            const meta = document.createElement("div");
            meta.className = "dictionary-meta";

            const parts = [];

            if (dictionary.year) {
                parts.push(dictionary.year);
            }

            if (dictionary.word_count !== undefined) {
                parts.push(
                    dictionary.word_count.toLocaleString("ru-RU") + " слов"
                );
            }

            meta.textContent = parts.join(" · ");
            item.appendChild(meta);

            if (dictionary.description) {
                const description = document.createElement("div");
                description.className = "description";
                description.textContent = dictionary.description;
                item.appendChild(description);
            }

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

    // Сохраняем прежнее содержимое вместе с обработчиками событий.
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