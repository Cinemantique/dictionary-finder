// Worker и индекс создаются при первом поисковом запросе.
const searchRequests = new Map();
let searchWorker;
let nextRequestId = 0;

function stopSearchWorker(worker, message) {
    if (worker !== searchWorker) return;
    worker.terminate();
    searchWorker = undefined;
    for (const { reject, timer } of searchRequests.values()) {
        clearTimeout(timer);
        reject(new Error(message));
    }
    searchRequests.clear();
}

function requestSearch(action, payload) {
    if (typeof INDEX_SUMMARY === "undefined") {
        return Promise.reject(new Error("Поисковый индекс ещё не собран."));
    }
    if (!searchWorker) {
        const worker = new Worker(new URL("js/search-worker.js", document.baseURI));
        worker.onmessage = ({ data: { id, result, error } }) => {
            const request = searchRequests.get(id);
            if (!request) return;
            searchRequests.delete(id);
            clearTimeout(request.timer);
            if (error) request.reject(new Error(error));
            else request.resolve(result);
        };
        worker.onerror = () => stopSearchWorker(worker, "Не удалось запустить поиск.");
        searchWorker = worker;
    }

    const worker = searchWorker;
    const id = ++nextRequestId;
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => stopSearchWorker(worker,
            "Поиск занял слишком много времени. Повторите запрос или уточните выражение."), 60_000);
        searchRequests.set(id, { resolve, reject, timer });
        worker.postMessage({ id, action, payload, manifest: INDEX_SUMMARY.manifest });
    });
}
