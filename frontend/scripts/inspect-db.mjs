import fs from "node:fs";
import pg from "pg";

const env = Object.fromEntries(
  fs.readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((linea) => linea && !linea.startsWith("#") && linea.includes("="))
    .map((linea) => {
      const indice = linea.indexOf("=");
      return [linea.slice(0, indice).trim(), linea.slice(indice + 1).trim()];
    })
);

const cliente = new pg.Client({
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});

await cliente.connect();
const conexion = await cliente.query("select current_database() as database, current_user as usuario");
console.log("Conexion correcta:", conexion.rows[0]);
const columnas = await cliente.query(`
  select table_name, column_name, data_type, is_nullable, column_default
  from information_schema.columns
  where table_schema = 'public'
  order by table_name, ordinal_position
`);
console.table(columnas.rows);
const resumen = await cliente.query(`
  select 'empresas' as tabla, count(*)::int as registros from empresas
  union all
  select 'usuarios', count(*)::int from usuarios
`);
console.table(resumen.rows);
const empresas = await cliente.query("select id, nombre from empresas order by id");
console.table(empresas.rows);
const usuariosPorEmpresa = await cliente.query("select e.id,e.nombre,count(u.id)::int as usuarios from empresas e left join usuarios u on u.empresa_id=e.id group by e.id,e.nombre order by e.id");
console.table(usuariosPorEmpresa.rows);
const configuraciones = await cliente.query("select empresa_id, plantilla_id, redes, actualizado_en from empresa_config order by empresa_id");
console.table(configuraciones.rows);
const restricciones = await cliente.query(`
  select tc.table_name, tc.constraint_type, kcu.column_name
  from information_schema.table_constraints tc
  left join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
  where tc.table_schema = 'public' and tc.table_name in ('empresas', 'usuarios')
  order by tc.table_name, tc.constraint_type
`);
console.table(restricciones.rows);
await cliente.end();
