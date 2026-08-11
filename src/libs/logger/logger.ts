import type { ILogger, ILoggerAdapter, ISafeLogMetadata, LogLevel } from '@/libs/logger/types';

const writeToConsole = (level: LogLevel, event: string, metadata?: ISafeLogMetadata): void => {
  const args = metadata ? [`[FastRep] ${event}`, metadata] : [`[FastRep] ${event}`];

  if (level === 'debug') {
    console.debug(...args);
  } else if (level === 'info') {
    console.info(...args);
  } else if (level === 'warn') {
    console.warn(...args);
  } else {
    console.error(...args);
  }
};

export const developmentLoggerAdapter: ILoggerAdapter = {
  write: writeToConsole,
};

export const productionLoggerAdapter: ILoggerAdapter = {
  write: (level, event, metadata) => {
    if (level === 'warn' || level === 'error') {
      writeToConsole(level, event, metadata);
    }
  },
};

interface ICreateLoggerInput {
  adapter?: ILoggerAdapter;
  isDevelopment: boolean;
}

export const createLogger = ({ adapter, isDevelopment }: ICreateLoggerInput): ILogger => {
  const selectedAdapter = adapter ?? (isDevelopment ? developmentLoggerAdapter : productionLoggerAdapter);
  const write = (level: LogLevel, event: string, metadata?: ISafeLogMetadata): void => {
    selectedAdapter.write(level, event, metadata);
  };

  return {
    debug: (event, metadata) => write('debug', event, metadata),
    error: (event, metadata) => write('error', event, metadata),
    info: (event, metadata) => write('info', event, metadata),
    warn: (event, metadata) => write('warn', event, metadata),
  };
};

export const logger = createLogger({ isDevelopment: __DEV__ });
