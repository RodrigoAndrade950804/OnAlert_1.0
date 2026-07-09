const { Client } = require('pg');
const mongoose = require('mongoose');

// ============================================
// CONFIGURACIÓN DE CONEXIÓN
// (Puedes modificar esto si cambiaste las credenciales en docker-compose)
// ============================================
const PG_URL = process.env.PG_URL || 'postgres://onalert_admin:admin_password@localhost:5433/onalert_auth';
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/onalert_incidents';

async function resetDatabases() {
  console.log('🔄 Iniciando reseteo de la Base de Datos...');

  let pgClient;

  try {
    // ----------------------------------------------------
    // 1. LIMPIEZA DE POSTGRESQL (Usuarios y Auth)
    // ----------------------------------------------------
    console.log('\n🐘 Conectando a PostgreSQL (Usuarios)...');
    pgClient = new Client({ connectionString: PG_URL });
    await pgClient.connect();

    // Borrar todo EXCEPTO los superadmins
    const res = await pgClient.query("DELETE FROM users WHERE role != 'superadmin';");
    console.log(`✅ Postgres: Se eliminaron ${res.rowCount} usuarios.`);
    console.log(`✅ Postgres: Se mantuvieron los usuarios con rol 'superadmin'.`);

  } catch (error) {
    console.error('❌ Error en PostgreSQL:', error.message);
  } finally {
    if (pgClient) await pgClient.end();
  }

  try {
    // ----------------------------------------------------
    // 2. LIMPIEZA DE MONGODB (Incidentes y Mensajes)
    // ----------------------------------------------------
    console.log('\n🍃 Conectando a MongoDB (Incidentes)...');
    await mongoose.connect(MONGO_URL);
    
    // Obtener la base de datos subyacente y vaciar colecciones
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    let deletedCount = 0;
    for (const collection of collections) {
      if (collection.name === 'incidents') {
        const result = await db.collection(collection.name).deleteMany({});
        deletedCount += result.deletedCount;
      }
    }

    console.log(`✅ MongoDB: Se eliminaron ${deletedCount} incidentes activos e históricos.`);

  } catch (error) {
    console.error('❌ Error en MongoDB:', error.message);
  } finally {
    await mongoose.connection.close();
  }

  console.log('\n🎉 ¡Limpieza de Base de Datos completada exitosamente!');
  console.log('💡 Consejo: Reinicia el frontend si lo tenías abierto para cargar los cambios desde cero.');
}

resetDatabases();
