export function each<T>(callback: (item: T) => any): (items: T[]) => Promise<T[]> {
    return (items: T[]) => new Promise((resolve, reject) => {
        var recursion = (items: T[]) => {
            if (items.length === 0) {
                return resolve(items);
            }
            var result: Promise<void> = callback(items.shift());
            if (isPromise(result)) {
                result
                    .then(() => recursion(items))
                    .catch(err => console.error(err.stack));
            } else {
                recursion(items);
            }
        };
        recursion(items.concat());
    });
}

export function map<T, U>(items: T[], callbackfn: (value: T, index: number, array: T[]) => Promise<U>) {
    return Promise.all(items.map(callbackfn));
}

export function safe<T>(reject: (e: any) => void, func: (...args: any[]) => T) {
    return (...args: any[]) => {
        try {
            func.apply(this, args);
        } catch (err) {
            reject(err);
        };
    };
}

function isPromise(obj: any) {
    return obj != null && typeof obj.then === 'function';
}
