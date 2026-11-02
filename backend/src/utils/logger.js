const formatMessage = (level, message, ...args) => {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.length > 0 ? ' ' + args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg)).join(' ') : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
};

export const logger = {
  info: (message, ...args) => {
    console.log(formatMessage('info', message, ...args));
  },
  warn: (message, ...args) => {
    console.warn(formatMessage('warn', message, ...args));
  },
  error: (message, ...args) => {
    console.error(formatMessage('error', message, ...args));
  },
  debug: (message, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('debug', message, ...args));
    }
  }
};

export default logger;
