importScripts("utils.js");

const indexUrl = new URL("../data/search/", self.location.href);
const compare = new Intl.Collator("ru").compare;
const pendingParts = new Map();
let manifestRequest;
let savedSearch;

function reverse(value) {
    return Array.from(value).reverse().join("");
}

async function fetchJson(filename, compressed = false) {
    const response = await fetch(new URL(filename, indexUrl));
    if (!response.ok) throw new Error("Не удалось загрузить часть индекса.");
    if (!compressed) return response.json();
    const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).json();
}

function readManifest(filename) {
    manifestRequest ??= fetchJson(filename).catch(error => {
        manifestRequest = undefined;
        throw error;
    });
    return manifestRequest;
}

function readPart(part) {
    if (!pendingParts.has(part.file)) {
        const request = fetchJson(part.file, true).catch(error => {
            pendingParts.delete(part.file);
            throw error;
        });
        pendingParts.set(part.file, request);
    }
    return pendingParts.get(part.file);
}

function partsWithPrefix(parts, prefix) {
    return parts.filter(({ first, last }) =>
        last >= prefix && (first < prefix || first.startsWith(prefix))
    );
}

async function lookup(manifest, word, distinguishYo) {
    const looseKey = normalize(word, false);
    const part = manifest.prefix.find(({ first, last }) => looseKey >= first && looseKey <= last);
    if (!part) return [];
    const groups = await readPart(part);
    if (!Object.hasOwn(groups, looseKey)) return [];
    const strictKey = normalize(word, true);
    const entries = groups[looseKey].filter(([headword]) =>
        !distinguishYo || normalize(headword, true) === strictKey
    );
    const numbers = new Set(entries.flatMap(([, ...ids]) => ids));
    return Array.from(numbers, number => manifest.dictionaryIds[number]);
}

function countsFor(group) {
    const strict = new Map();
    const loose = new Set();
    for (const [word, ...numbers] of group) {
        const key = normalize(word, true);
        if (!strict.has(key)) strict.set(key, new Set());
        for (const number of numbers) {
            strict.get(key).add(number);
            loose.add(number);
        }
    }
    return group.map(([word]) => [word, strict.get(normalize(word, true)).size, loose.size]);
}

function selectParts(manifest, query, regex) {
    if (regex) return { parts: manifest.suffix, fromPrefix: false };

    const prefix = normalize(query.split(/[*?]/u, 1)[0], false);
    const suffix = reverse(normalize(/[^*?]*$/u.exec(query)[0], false));
    const ending = partsWithPrefix(manifest.suffix, suffix);
    if (!prefix) return { parts: ending, fromPrefix: false };
    const beginning = partsWithPrefix(manifest.prefix, prefix);
    const size = parts => parts.reduce((total, part) => total + part.bytes, 0);
    return size(beginning) <= size(ending)
        ? { parts: beginning, fromPrefix: true }
        : { parts: ending, fromPrefix: false };
}

async function search(manifest, { query, regex, distinguishYo }) {
    const pattern = regex ? prepareRegex(query, distinguishYo) : null;
    const matchesWord = pattern ? word => pattern.test(word) : wildcardMatcher(query, distinguishYo);
    const { parts, fromPrefix } = selectParts(manifest, query, regex);
    const matches = [];

    // Load small batches to limit simultaneous requests and parsing.
    for (let start = 0; start < parts.length; start += 6) {
        const batch = await Promise.all(parts.slice(start, start + 6).map(readPart));
        for (const part of batch) {
            if (fromPrefix) {
                for (const group of Object.values(part)) {
                    if (group.some(([word]) => matchesWord(word))) {
                        for (const [word, strict, loose] of countsFor(group)) {
                            if (matchesWord(word)) matches.push([word, distinguishYo ? strict : loose]);
                        }
                    }
                }
            } else {
                for (const [word, strict, loose = strict] of part) {
                    if (matchesWord(word)) matches.push([word, distinguishYo ? strict : loose]);
                }
            }
        }
    }

    matches.sort(([left], [right]) => compare(left, right));
    return matches;
}

self.onmessage = async ({ data: { id, action, payload, manifest } }) => {
    try {
        const index = await readManifest(manifest);
        let result;
        if (action === "lookup") {
            result = await lookup(index, payload.word, payload.distinguishYo);
        } else {
            const { query, regex, distinguishYo, page, pageSize } = payload;
            const key = JSON.stringify([query, regex, distinguishYo]);
            if (savedSearch?.key !== key) {
                const request = search(index, payload).catch(error => {
                    if (savedSearch?.key === key) savedSearch = undefined;
                    throw error;
                });
                savedSearch = { key, request };
            }
            const matches = await savedSearch.request;
            const start = (page - 1) * pageSize;
            result = { total: matches.length, entries: matches.slice(start, start + pageSize) };
        }
        self.postMessage({ id, result });
    } catch (error) {
        self.postMessage({ id, error: error.message });
    }
};
