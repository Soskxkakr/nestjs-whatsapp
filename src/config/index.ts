import * as dotenv from 'dotenv';

export default () => {
  dotenv.config({
    path: `${process.cwd()}/.env${
      process.env.ENVIRONMENT ? `.${process.env.ENVIRONMENT}` : ''
    }`,
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const developmentConfig = require('./config.development');
  return developmentConfig;
};
