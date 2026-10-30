// Нормализация Е/Ё

function normalize(text, distinguishYo) {
    text = text.toLowerCase();

    return distinguishYo
        ? text
        : text.replace(/ё/g, "е");
}


// Преобразование маски в регулярное выражение
// * — любая последовательность символов
// ? — один любой символ

function wildcardToRegex(mask, distinguishYo) {
    let pattern = "";

    for (const char of mask.toLowerCase()) {
        if (char === "*") {
            pattern += ".*";
        } else if (char === "?") {
            pattern += ".";
        } else if (
            (char === "ё" || char === "е") &&
            !distinguishYo
        ) {
            pattern += "[её]";
        } else {
            pattern += char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }
    }

    return new RegExp("^" + pattern + "$", "iu");
}


// Подготовка регулярного выражения

function prepareRegex(pattern, distinguishYo) {
    if (!distinguishYo) {
        pattern = pattern.replace(/[её]/gi, "[её]");
    }

    return new RegExp(pattern, "iu");
}


// Получение словарей для слова

function getDictionaryIds(word, distinguishYo) {
    if (distinguishYo) {
        return index[word] || [];
    }

    const variants = normalizedIndex[normalize(word, false)] || [];

    return [
        ...new Set(
            variants.flatMap(w => index[w] || [])
        )
    ];
}