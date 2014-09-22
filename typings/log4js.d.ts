// �g���Ă�����̂�����`���Ă��Ȃ�
declare module 'log4js' {
    export function configure(configurationFileOrObject: any, options?: any): void;
    export function getLogger(categoryName: string): Logger;

    interface Logger {
        trace(...args: any[]): void;
        debug(...args: any[]): void;
        info(...args: any[]): void;
        warn(...args: any[]): void;
        error(...args: any[]): void;
        fatal(...args: any[]): void;
    }
}
