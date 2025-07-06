import { AsyncLocalStorage } from 'async_hooks';
import { Logger } from '../domain/services/Logger';

export class RequestContext {
    private static instance: RequestContext;
    private asyncLocalStorage: AsyncLocalStorage<Logger>;

    private constructor() {
        this.asyncLocalStorage = new AsyncLocalStorage<Logger>();
    }

    public static getInstance(): RequestContext {
        if (!RequestContext.instance) {
            RequestContext.instance = new RequestContext();
        }
        return RequestContext.instance;
    }

    public runWithLogger<T>(logger: Logger, callback: () => T): T {
        return this.asyncLocalStorage.run(logger, callback);
    }

    public getLogger(): Logger | undefined {
        return this.asyncLocalStorage.getStore();
    }

    public getCurrentLogger(): Logger {
        const logger = this.asyncLocalStorage.getStore();
        if (!logger) {
            throw new Error('No logger context available. Make sure you are inside a request context.');
        }
        return logger;
    }
}

// Funciones de conveniencia para usar en cualquier parte del código
export const getRequestLogger = (): Logger => {
    return RequestContext.getInstance().getCurrentLogger();
};

export const addLog = (key: string, value: unknown): void => {
    const logger = RequestContext.getInstance().getLogger();
    if (logger) {
        logger.add(key, value);
    }
};

export const addError = (key: string, value: unknown, code?: string): void => {
    const logger = RequestContext.getInstance().getLogger();
    if (logger) {
        logger.error(key, value, code);
    }
}; 