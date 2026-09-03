import pg from "pg";

const globalDb = globalThis;
export const pool = globalDb.__vcarPool || new pg.Pool({
  host: import.meta.env.DB_HOST,
  port: Number(import.meta.env.DB_PORT),
  database: import.meta.env.DB_NAME,
  user: import.meta.env.DB_USER,
  password: import.meta.env.DB_PASSWORD,
  max: 10,
});
if (import.meta.env.DEV) globalDb.__vcarPool = pool;

export const query = (texto, parametros = []) => pool.query(texto, parametros);
