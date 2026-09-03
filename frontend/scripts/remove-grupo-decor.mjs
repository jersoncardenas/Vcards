import fs from "node:fs";
import pg from "pg";
const env=Object.fromEntries(fs.readFileSync(new URL("../.env",import.meta.url),"utf8").split(/\r?\n/).filter(x=>x&&!x.startsWith("#")&&x.includes("=")).map(x=>{const i=x.indexOf("=");return[x.slice(0,i).trim(),x.slice(i+1).trim()]}));
const cliente=new pg.Client({host:env.DB_HOST,port:Number(env.DB_PORT),database:env.DB_NAME,user:env.DB_USER,password:env.DB_PASSWORD});
await cliente.connect();
await cliente.query("begin");
try {
  const empresa=await cliente.query("select id from empresas where lower(nombre)=lower($1) for update",["Grupo Decor"]);
  if(empresa.rowCount){
    const id=empresa.rows[0].id;
    const usuarios=await cliente.query("delete from usuarios where empresa_id=$1 returning id",[id]);
    await cliente.query("delete from empresa_config where empresa_id=$1",[id]);
    await cliente.query("delete from empresas where id=$1",[id]);
    console.log(`Eliminados: ${usuarios.rowCount} colaboradores y la empresa Grupo Decor.`);
  } else console.log("Grupo Decor ya no existe en la base de datos.");
  await cliente.query("commit");
} catch(error){await cliente.query("rollback");throw error} finally {await cliente.end()}
