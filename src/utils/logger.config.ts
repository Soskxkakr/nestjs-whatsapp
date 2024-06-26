import { LoggerOptions } from 'pino';

export const pinoConfig: LoggerOptions = {
  timestamp: () => `,"time":"${new Date().toJSON()}"`,
  level: 'trace', // Set default log level here if needed
};
