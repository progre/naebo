export enum TicketType {
    open = 0,
    inprogress = 1,
    close = 2
}

export interface User {
    provider: string;
    providerId: string;
}
