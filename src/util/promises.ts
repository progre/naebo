export function each<T>(callback: (item: T) => any): (items: T[]) => Promise<T[]> {
    return (items: T[]) => new Promise((resolve, reject) => {
        var recursion = (items: T[]) => {
            if (items.length === 0) {
                return resolve(items);
            }
            var result = callback(items.shift());
            if (isPromise(result)) {
                result.then(() => recursion(items));
            } else {
                recursion(items);
            }
        };
        recursion(items.concat());
    });
}

function isPromise(obj: any) {
    return obj != null && typeof obj.then === 'function';
}
