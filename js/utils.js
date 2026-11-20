// Ключ поиска с сохранением исходного написания в результатах.
function normalize(text, distinguishYo) {
    const key = text.normalize("NFC").toLowerCase();
    return distinguishYo ? key : key.replace(/ё/g, "е");
}

// * соответствует любой последовательности, ? — одному символу.
function wildcardMatcher(mask, distinguishYo) {
    const keyMask = normalize(mask, distinguishYo).replace(/\*{2,}/gu, "*");
    const parts = keyMask.split("*");
    if (!keyMask.includes("?") && parts.length === 2) {
        const [start, end] = parts;
        return word => {
            const key = normalize(word, distinguishYo);
            return key.length >= start.length + end.length && key.startsWith(start) && key.endsWith(end);
        };
    }

    const pattern = Array.from(keyMask);
    return word => {
        const key = normalize(word, distinguishYo);
        const symbols = Array.from(key);
        let position = 0;
        let next = 0;
        let star = -1;
        let afterStar = 0;

        while (position < symbols.length) {
            if (pattern[next] === "*") {
                star = next++;
                afterStar = position;
            } else if (pattern[next] === "?" || pattern[next] === symbols[position]) {
                position++;
                next++;
            } else if (star !== -1) {
                position = ++afterStar;
                next = star + 1;
            } else {
                return false;
            }
        }
        while (pattern[next] === "*") next++;
        return next === pattern.length;
    };
}

function prepareRegex(pattern, distinguishYo) {
    if (!distinguishYo) {
        pattern = pattern.replace(/[её]/gi, "[её]");
    }
    return new RegExp(pattern, "iu");
}
