export const measureLatency = async (url: string): Promise<string | null> => {
    const startTime = performance.now();
    const latency = await fetch(url, { method: 'OPTIONS' })
        .then(() => {
            const latency = performance.now() - startTime;
            return latency.toFixed(2);
        })
        .catch(error => console.error('Request failed:', error));
    return latency ?? null;
}