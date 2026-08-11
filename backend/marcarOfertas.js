const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
require('dotenv').config();
const Libro = require('./models/Libro');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://jgerardoqq_db_user:estudio2012@ac-5kj0be3-shard-00-00.kgznko4.mongodb.net:27017,ac-5kj0be3-shard-00-01.kgznko4.mongodb.net:27017,ac-5kj0be3-shard-00-02.kgznko4.mongodb.net:27017/libreria_mern?authSource=admin&ssl=true&replicaSet=atlas-ngsmvl-shard-0&appName=ClusterCulebra';

// isbn -> precio de oferta
const OFERTAS = {
  '978-8478884452': 279,   // Harry Potter 1 (Fantasia)
  '978-8445000663': 359,   // Senor de los Anillos (Fantasia)
  '978-8445003015': 319,   // El hobbit (Fantasia)
  '978-0451524935': 199,   // 1984 (Ciencia Ficcion)
  '978-8498386188': 199,   // Los juegos del hambre (Ciencia Ficcion)
  '978-0307474728': 255,   // Cien Anos de Soledad (Literatura)
  '978-8420412146': 224,   // Don Quijote (Literatura)
  '978-0156012195': 99,    // El Principito (Infantil)
  '978-8418112070': 232,   // Habitos Atomicos (Autoayuda)
  '978-8499926223': 304,   // Sapiens (Historia)
  '978-8497940171': 129,   // El arte de la guerra (Historia)
  '978-0307474278': 240,   // El Codigo Da Vinci (Misterio)
  '978-0307594839': 200,   // Bajo la misma estrella (Romance)
  '978-8499923400': 272    // Inteligencia Artificial (Tecnologia)
};

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Conectado a MongoDB...');

  let actualizados = 0;
  for (const [isbn, precioOferta] of Object.entries(OFERTAS)) {
    const res = await Libro.updateOne(
      { isbn },
      { $set: { precioOferta } }
    );
    if (res.modifiedCount) {
      actualizados++;
      console.log(`  Oferta aplicada a ISBN ${isbn} -> $${precioOferta}`);
    }
  }

  const total = await Libro.countDocuments({ precioOferta: { $ne: null } });
  console.log('----------------------------------');
  console.log(`Actualizados: ${actualizados} | Total de libros en oferta: ${total}`);

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
