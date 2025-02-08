export const measureLatency = async (): Promise<string | null> => {
    let latency = Date.now().valueOf();
    await fetch('http://localhost:4500').then(() => {
        latency = Date.now().valueOf() - latency;
    });
    return latency.toString();
}