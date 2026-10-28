import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'mysql',
  connections: {
    mysql: {
      client: 'mysql2',
      connection: {
        ...(env.get('DB_SOCKET')
          ? { socketPath: env.get('DB_SOCKET') }
          : {
              host: env.get('DB_HOST'),
              port: env.get('DB_PORT'),
            }),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
        // MySQL 8 Docker often closes host connections if the client starts TLS.
        ssl: false,
      },
      pool: {
        min: 0,
        max: 10,
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig