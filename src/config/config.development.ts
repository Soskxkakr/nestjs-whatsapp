export default {
  app: {
    port: process.env.PORT || 8080,
    host: '0.0.0.0',
  },
  logLevel: 'info',
  ssms: {
    host: process.env.DB_HOST,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    dbName: process.env.DB_NAME,
  },
  azure: {
    container: {
      connectionString: process.env.CONTAINER_CONNECTION_STRING,
      url: process.env.CONTAINER_URL,
      name: process.env.CONTAINER_NAME,
    },
  },
};
