export type LogLevel = 'debug' | 'error' | 'info' | 'warn';

export interface ISafeLogMetadata {
  assetType?: 'AUDIO' | 'DOCUMENT' | 'IMAGE';
  durationSeconds?: number;
  errorCode?: string;
  generationStatus?: string;
  httpStatus?: number;
  mimeType?: string;
  operation?: string;
  platform?: string;
  progress?: number;
  reportStatus?: string;
  size?: number;
  source?: string;
  stage?: string;
  uriScheme?: string;
}

export interface ILoggerAdapter {
  write(level: LogLevel, event: string, metadata?: ISafeLogMetadata): void;
}

export interface ILogger {
  debug(event: string, metadata?: ISafeLogMetadata): void;
  error(event: string, metadata?: ISafeLogMetadata): void;
  info(event: string, metadata?: ISafeLogMetadata): void;
  warn(event: string, metadata?: ISafeLogMetadata): void;
}
