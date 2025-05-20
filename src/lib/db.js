// src/lib/db.js
import mysql from 'mysql2/promise';

// Configura los detalles de la conexión usando variables de entorno
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Función para ejecutar consultas
// Usaremos un pool de conexiones para mayor eficiencia
// El pool se crea una sola vez y se reutiliza
let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    console.log('MySQL Connection Pool created successfully.');

    // Manejo de errores del pool (opcional pero recomendado)
    pool.on('error', (err) => {
      console.error('MySQL Pool Error:', err);
      // Aquí podrías intentar recrear el pool o manejar el error de otra forma
      pool = null; // Marcar el pool como nulo para que se intente recrear en la próxima solicitud
    });
  }
  return pool;
}

export async function query(sql, params) {
  const currentPool = getPool();
  try {
    const [results] = await currentPool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error executing query:', { sql, params, error });
    // Podrías querer lanzar un error más específico o manejarlo de otra forma
    throw new Error(`Database query failed: ${error.message}`);
  }
  // No cerramos la conexión aquí porque el pool la gestiona.
}