import fs from "node:fs";
import pg from "pg";
const env = Object.fromEntries(fs.readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/).filter(x => x && !x.startsWith("#") && x.includes("=")).map(x => { const i=x.indexOf("="); return [x.slice(0,i).trim(),x.slice(i+1).trim()]; }));
const cliente = new pg.Client({ host:env.DB_HOST, port:Number(env.DB_PORT), database:env.DB_NAME, user:env.DB_USER, password:env.DB_PASSWORD });
await cliente.connect();
await cliente.query(`
  create table if not exists empresa_config (
    empresa_id integer primary key references empresas(id) on delete cascade,
    plantilla_id integer not null,
    redes jsonb not null default '{}'::jsonb,
    actualizado_en timestamptz not null default now()
  );
  alter table empresa_config add column if not exists colores jsonb not null default '{}'::jsonb;
  insert into empresa_config (empresa_id, plantilla_id)
  select id, id from empresas on conflict (empresa_id) do nothing;

  alter table usuarios drop constraint if exists usuarios_correo_key;
  create unique index if not exists ux_usuarios_empresa_correo
    on usuarios (empresa_id, correo);
  create unique index if not exists ux_usuarios_empresa_telefono
    on usuarios (empresa_id, telefono);
`);
await cliente.end();
console.log("Estructura administrativa y unicidad por empresa preparadas correctamente.");
