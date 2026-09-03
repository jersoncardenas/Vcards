import pg from "pg";

const globalDb = globalThis;
const entorno = (nombre) => process.env[nombre] || import.meta.env[nombre];
export const pool = globalDb.__vcarPool || new pg.Pool({
  host: entorno("DB_HOST"),
  port: Number(entorno("DB_PORT")),
  database: entorno("DB_NAME"),
  user: entorno("DB_USER"),
  password: entorno("DB_PASSWORD"),
  max: 10,
});
if (import.meta.env.DEV) globalDb.__vcarPool = pool;

export const query = (texto, parametros = []) => pool.query(texto, parametros);
