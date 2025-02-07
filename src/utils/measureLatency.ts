export const measureLatency = async (): Promise<string | null> => {
    const latency = Math.floor(Math.random() * 300);
    await new Promise((resolve) => setTimeout(resolve, latency));
    return latency.toString();
} // Returns a random latency value between 0 and 300 ms as a string lol