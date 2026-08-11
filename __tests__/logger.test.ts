import { createLogger } from '@/libs/logger/logger';
import type { ILoggerAdapter } from '@/libs/logger/types';

describe('logger', () => {
  it('forwards every level to the development adapter', () => {
    const adapter: ILoggerAdapter = { write: jest.fn() };
    const developmentLogger = createLogger({ adapter, isDevelopment: true });

    developmentLogger.debug('debug.event', { operation: 'test' });
    developmentLogger.info('info.event');
    developmentLogger.warn('warn.event');
    developmentLogger.error('error.event', { errorCode: 'expected_code' });

    expect(adapter.write).toHaveBeenNthCalledWith(1, 'debug', 'debug.event', { operation: 'test' });
    expect(adapter.write).toHaveBeenNthCalledWith(2, 'info', 'info.event', undefined);
    expect(adapter.write).toHaveBeenNthCalledWith(3, 'warn', 'warn.event', undefined);
    expect(adapter.write).toHaveBeenNthCalledWith(4, 'error', 'error.event', { errorCode: 'expected_code' });
  });

  it('makes debug and info no-ops in production while preserving warn and error', () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => undefined);
    const info = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const productionLogger = createLogger({ isDevelopment: false });

    productionLogger.debug('debug.event');
    productionLogger.info('info.event');
    productionLogger.warn('warn.event', { operation: 'test' });
    productionLogger.error('error.event', { errorCode: 'expected_code' });

    expect(debug).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('[FastRep] warn.event', { operation: 'test' });
    expect(error).toHaveBeenCalledWith('[FastRep] error.event', { errorCode: 'expected_code' });

    debug.mockRestore();
    info.mockRestore();
    warn.mockRestore();
    error.mockRestore();
  });
});
