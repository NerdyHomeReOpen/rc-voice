export const measureLatency = async (): Promise<string> => {
  const start = Date.now();
  let end = 0;
  const latency = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}`).then(
    () => {
      end = Date.now();
      return (end - start).toFixed(0);
    },
  );
  return latency;
};
