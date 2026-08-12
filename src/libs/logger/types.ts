export type LogLevel = 'debug' | 'error' | 'info' | 'warn';

export interface ISafeLogMetadata {
  assetCount?: number;
  assetType?: 'AUDIO' | 'DOCUMENT' | 'IMAGE';
  declaredMimeType?: string;
  durationSeconds?: number;
  errorCode?: string;
  generationStatus?: string;
  hasFileName?: boolean;
  hasFileSize?: boolean;
  hasUri?: boolean;
  height?: number;
  httpStatus?: number;
  mimeType?: string;
  operation?: string;
  platform?: string;
  progress?: number;
  reportStatus?: string;
  size?: number;
  source?: string;
  stage?: string;
  status?: string;
  uriScheme?: string;
  width?: number;
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
