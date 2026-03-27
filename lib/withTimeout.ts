export const withTimeout = <T>(
    promise: Promise<T>,
    ms: number,
    timeoutMessage: string = 'Operation timed out',
): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(timeoutMessage));
        }, ms);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
        clearTimeout(timeoutId);
    });
};
