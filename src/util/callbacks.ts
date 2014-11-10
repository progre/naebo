export function tryFunc(func: (...args: any[]) => void) {
    return (...args: any[]) => {
        try {
            func.apply(this, args);
        } catch (err) {
            console.error(err.stack);
        };
    };
}
