const mongoose = require('mongoose');
require('dotenv').config();
const Libro = require('./models/Libro');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/libreria_mern';

const LIBROS = [
  // ---------- AUTOAYUDA ----------
  { titulo: 'El monje que vendio su Ferrari', autor: 'Robin Sharma', isbn: '978-8490702198', categoria: 'Autoayuda', precio: 220, stock: 25, destacado: true, descripcion: 'Fabula sobre el exito, la felicidad y el equilibrio en la vida.' },
  { titulo: 'Pensar rapido, pensar despacio', autor: 'Daniel Kahneman', isbn: '978-8499895775', categoria: 'Autoayuda', precio: 320, stock: 18, descripcion: 'El Premio Nobel explica los dos sistemas que gobiernan la mente.' },
  { titulo: 'Los 7 habitos de la gente altamente efectiva', autor: 'Stephen Covey', isbn: '978-8449336500', categoria: 'Autoayuda', precio: 280, stock: 20, descripcion: 'Habitos para la efectividad personal y profesional.' },
  { titulo: 'El metodo Ikigai', autor: 'Francesc Miralles', isbn: '978-8494899573', categoria: 'Autoayuda', precio: 250, stock: 22, descripcion: 'El secreto japones para una vida larga y feliz.' },
  { titulo: 'Como ganar amigos e influir sobre las personas', autor: 'Dale Carnegie', isbn: '978-8427038477', categoria: 'Autoayuda', precio: 240, stock: 26, descripcion: 'El clasico de las relaciones humanas.' },
  { titulo: 'Mente millonaria', autor: 'T. Harv Eker', isbn: '978-8478085779', categoria: 'Autoayuda', precio: 230, stock: 24, descripcion: 'El exito financiero depende de tu mentalidad.' },
  { titulo: 'El sutil arte de que te importe un carajo', autor: 'Mark Manson', isbn: '978-8494393544', categoria: 'Autoayuda', precio: 260, stock: 30, descripcion: 'Un enfoque contraintuitivo para vivir mejor.' },
  { titulo: 'Grit: El poder de la pasion y la perseverancia', autor: 'Angela Duckworth', isbn: '978-8494542229', categoria: 'Autoayuda', precio: 270, stock: 15, descripcion: 'La clave del exito es la constancia, no el talento.' },

  // ---------- CIENCIA FICCION ----------
  { titulo: 'El fin de la eternidad', autor: 'Isaac Asimov', isbn: '978-8499087658', categoria: 'Ciencia Ficcion', precio: 300, stock: 16, descripcion: 'Los Eternos viajan por el tiempo para moldear la humanidad.' },
  { titulo: 'Yo, robot', autor: 'Isaac Asimov', isbn: '978-8499893825', categoria: 'Ciencia Ficcion', precio: 290, stock: 18, destacado: true, descripcion: 'Los relatos que crearon las tres leyes de la robotica.' },
  { titulo: 'Neuromante', autor: 'William Gibson', isbn: '978-8445004272', categoria: 'Ciencia Ficcion', precio: 310, stock: 12, descripcion: 'La novela fundacional del ciberpunk.' },
  { titulo: 'Los juegos del hambre', autor: 'Suzanne Collins', isbn: '978-8498386188', categoria: 'Ciencia Ficcion', precio: 280, stock: 25, destacado: true, descripcion: 'Katniss lucha por su vida en la arena.' },
  { titulo: 'Un mundo feliz', autor: 'Aldous Huxley', isbn: '978-8491050818', categoria: 'Ciencia Ficcion', precio: 250, stock: 20, descripcion: 'La distopia de la sociedad perfecta y controlada.' },
  { titulo: 'El problema de los tres cuerpos', autor: 'Liu Cixin', isbn: '978-8499089155', categoria: 'Ciencia Ficcion', precio: 380, stock: 14, descripcion: 'El primer contacto con una civilizacion alienigena.' },
  { titulo: 'Ready Player One', autor: 'Ernest Cline', isbn: '978-8415631734', categoria: 'Ciencia Ficcion', precio: 340, stock: 10, descripcion: 'Una caza del tesoro dentro de un mundo virtual.' },

  // ---------- FANTASIA ----------
  { titulo: 'Harry Potter y la camara secreta', autor: 'J.K. Rowling', isbn: '978-8478884957', categoria: 'Fantasia', precio: 350, stock: 20, descripcion: 'El segundo ano de Harry en Hogwarts.' },
  { titulo: 'Harry Potter y el prisionero de Azkaban', autor: 'J.K. Rowling', isbn: '978-8478884964', categoria: 'Fantasia', precio: 350, stock: 19, descripcion: 'Sirius Black escapa de la prision de Azkaban.' },
  { titulo: 'El hobbit', autor: 'J.R.R. Tolkien', isbn: '978-8445003015', categoria: 'Fantasia', precio: 400, stock: 15, destacado: true, descripcion: 'La aventura de Bilbo Bolson hacia la Montana Solitaria.' },
  { titulo: 'Las cronicas de Narnia', autor: 'C.S. Lewis', isbn: '978-8408056302', categoria: 'Fantasia', precio: 330, stock: 17, descripcion: 'La tierra magica detras del armario.' },
  { titulo: 'El nombre del viento', autor: 'Patrick Rothfuss', isbn: '978-8499083483', categoria: 'Fantasia', precio: 360, stock: 13, descripcion: 'La historia de Kvothe, el asesino de reyes.' },
  { titulo: 'Juego de tronos', autor: 'George R.R. Martin', isbn: '978-8496208560', categoria: 'Fantasia', precio: 420, stock: 11, destacado: true, descripcion: 'Intrigas y batallas por el Trono de Hierro.' },
  { titulo: 'Percy Jackson y el ladron del rayo', autor: 'Rick Riordan', isbn: '978-8408103146', categoria: 'Fantasia', precio: 270, stock: 21, descripcion: 'Un semidios debe recuperar el rayo de Zeus.' },
  { titulo: 'Coraline', autor: 'Neil Gaiman', isbn: '978-8448035440', categoria: 'Fantasia', precio: 240, stock: 18, descripcion: 'Una nina descubre una puerta secreta a otra casa.' },

  // ---------- HISTORIA ----------
  { titulo: 'El arte de la guerra', autor: 'Sun Tzu', isbn: '978-8497940171', categoria: 'Historia', precio: 180, stock: 30, destacado: true, descripcion: 'El tratado estrategico mas famoso de la historia.' },
  { titulo: 'Diario de Ana Frank', autor: 'Ana Frank', isbn: '978-8420454795', categoria: 'Historia', precio: 200, stock: 28, descripcion: 'El testimonio de una nina judia durante la Segunda Guerra Mundial.' },
  { titulo: '1492: El ano en que el mundo comenzo', autor: 'Felipe Fernandez-Armesto', isbn: '978-8434422104', categoria: 'Historia', precio: 290, stock: 14, descripcion: 'Como un solo ano transformo el mundo moderno.' },
  { titulo: 'Napoleon: Una vida', autor: 'Andrew Roberts', isbn: '978-8499924069', categoria: 'Historia', precio: 380, stock: 9, descripcion: 'La biografia definitiva del emperador frances.' },
  { titulo: 'Los origenes del totalitarismo', autor: 'Hannah Arendt', isbn: '978-8420648585', categoria: 'Historia', precio: 340, stock: 10, descripcion: 'El analisis clasico del totalitarismo del siglo XX.' },
  { titulo: 'El colapso: Por que unas sociedades perduran y otras desaparecen', autor: 'Jared Diamond', isbn: '978-8497939380', categoria: 'Historia', precio: 320, stock: 12, descripcion: 'Por que caen las civilizaciones.' },
  { titulo: 'La segunda guerra mundial', autor: 'Antony Beevor', isbn: '978-8499890572', categoria: 'Historia', precio: 400, stock: 8, descripcion: 'La vision global del conflicto mas grande de la historia.' },
  { titulo: 'Historia de Roma', autor: 'Indro Montanelli', isbn: '978-8497939816', categoria: 'Historia', precio: 310, stock: 11, descripcion: 'El ascenso y caida del Imperio romano.' },

  // ---------- INFANTIL ----------
  { titulo: 'Charlie y la fabrica de chocolate', autor: 'Roald Dahl', isbn: '978-8420464510', categoria: 'Infantil', precio: 200, stock: 25, descripcion: 'Charlie visita la increible fabrica de Willy Wonka.' },
  { titulo: 'El Grufalo', autor: 'Julia Donaldson', isbn: '978-8493923960', categoria: 'Infantil', precio: 190, stock: 24, descripcion: 'Un raton inventa un monstruo para asustar a sus enemigos.' },
  { titulo: 'La oruga muy hambrienta', autor: 'Eric Carle', isbn: '978-8484703864', categoria: 'Infantil', precio: 210, stock: 22, destacado: true, descripcion: 'La historia de una oruga que come sin parar.' },
  { titulo: 'Donde viven los monstruos', autor: 'Maurice Sendak', isbn: '978-8484700429', categoria: 'Infantil', precio: 195, stock: 20, descripcion: 'El viaje de Max al pais de los monstruos.' },
  { titulo: 'Alicia en el pais de las maravillas', autor: 'Lewis Carroll', isbn: '978-8491051888', categoria: 'Infantil', precio: 230, stock: 18, descripcion: 'Las aventuras de Alicia en un mundo absurdo.' },
  { titulo: 'Historia de una gaviota y del gato que le enseno a volar', autor: 'Luis Sepulveda', isbn: '978-8493439293', categoria: 'Infantil', precio: 220, stock: 19, descripcion: 'Un gato cumple la promesa de ensenar a volar a una gaviota.' },
  { titulo: 'El gigante egoista', autor: 'Oscar Wilde', isbn: '978-8434840054', categoria: 'Infantil', precio: 175, stock: 26, descripcion: 'Un jardin prohibido vuelve a florecer con los ninos.' },
  { titulo: 'Peter Pan', autor: 'J.M. Barrie', isbn: '978-8426145968', categoria: 'Infantil', precio: 205, stock: 21, descripcion: 'El nino que no queria crecer.' },

  // ---------- LITERATURA ----------
  { titulo: 'Crimen y castigo', autor: 'Fiodor Dostoievski', isbn: '978-8491050481', categoria: 'Literatura', precio: 350, stock: 16, descripcion: 'Raskolnikov mata y vive atormentado por su culpa.' },
  { titulo: 'Guerra y paz', autor: 'Leon Tolstoi', isbn: '978-8491050740', categoria: 'Literatura', precio: 450, stock: 8, descripcion: 'La epica napoleonica vista por la aristocracia rusa.' },
  { titulo: 'Moby Dick', autor: 'Herman Melville', isbn: '978-8491050795', categoria: 'Literatura', precio: 330, stock: 12, descripcion: 'El capitan Ahab persigue a la gran ballena blanca.' },
  { titulo: 'La metamorfosis', autor: 'Franz Kafka', isbn: '978-8491050764', categoria: 'Literatura', precio: 240, stock: 20, descripcion: 'Gregor Samsa despierta convertido en insecto.' },
  { titulo: 'El retrato de Dorian Gray', autor: 'Oscar Wilde', isbn: '978-8491050641', categoria: 'Literatura', precio: 260, stock: 18, descripcion: 'Un retrato envejece en lugar de su joven modelo.' },
  { titulo: 'Frankenstein', autor: 'Mary Shelley', isbn: '978-8491050566', categoria: 'Literatura', precio: 270, stock: 17, descripcion: 'El doctor que creo vida y desato una tragedia.' },
  { titulo: 'Ulises', autor: 'James Joyce', isbn: '978-8491050894', categoria: 'Literatura', precio: 420, stock: 7, descripcion: 'Un dia en la vida de Leopold Bloom en Dublin.' },
  { titulo: 'En busca del tiempo perdido', autor: 'Marcel Proust', isbn: '978-8491050429', categoria: 'Literatura', precio: 460, stock: 6, descripcion: 'La memoria y el tiempo en la obra maestra de Proust.' },

  // ---------- MISTERIO ----------
  { titulo: 'Asesinato en el Orient Express', autor: 'Agatha Christie', isbn: '978-8497594019', categoria: 'Misterio', precio: 260, stock: 20, descripcion: 'Poirot investiga un asesinato en un tren detenido.' },
  { titulo: 'Diez negritos', autor: 'Agatha Christie', isbn: '978-8497592855', categoria: 'Misterio', precio: 250, stock: 19, destacado: true, descripcion: 'Diez invitados mueren uno a uno en una isla.' },
  { titulo: 'El asesinato de Roger Ackroyd', autor: 'Agatha Christie', isbn: '978-8497592862', categoria: 'Misterio', precio: 250, stock: 18, descripcion: 'El caso que cambio las reglas del genero policiaco.' },
  { titulo: 'El perro de los Baskerville', autor: 'Arthur Conan Doyle', isbn: '978-8491050917', categoria: 'Misterio', precio: 220, stock: 22, descripcion: 'Sherlock Holmes y la maldicion de la familia Baskerville.' },
  { titulo: 'Las aventuras de Sherlock Holmes', autor: 'Arthur Conan Doyle', isbn: '978-8491050993', categoria: 'Misterio', precio: 280, stock: 21, descripcion: 'Doce casos del detective mas famoso del mundo.' },
  { titulo: 'El silencio de los corderos', autor: 'Thomas Harris', isbn: '978-8466321500', categoria: 'Misterio', precio: 290, stock: 15, descripcion: 'Clarice Starling busca la ayuda de Hannibal Lecter.' },
  { titulo: 'La sombra del viento', autor: 'Carlos Ruiz Zafon', isbn: '978-8497593463', categoria: 'Misterio', precio: 310, stock: 16, descripcion: 'Un libro maldito en el cementerio de los libros olvidados.' },
  { titulo: 'Sharp Objects', autor: 'Gillian Flynn', isbn: '978-8499087603', categoria: 'Misterio', precio: 270, stock: 13, descripcion: 'Una periodista vuelve a su pueblo para cubrir un crimen.' },

  // ---------- ROMANCE ----------
  { titulo: 'Cumbres borrascosas', autor: 'Emily Bronte', isbn: '978-8491050504', categoria: 'Romance', precio: 240, stock: 20, descripcion: 'Heathcliff y Catherine: amor, odio y venganza.' },
  { titulo: 'Jane Eyre', autor: 'Charlotte Bronte', isbn: '978-8491050474', categoria: 'Romance', precio: 250, stock: 19, descripcion: 'La institutriz que desafio su destino.' },
  { titulo: 'Anna Karenina', autor: 'Leon Tolstoi', isbn: '978-8491050702', categoria: 'Romance', precio: 360, stock: 12, descripcion: 'Una pasion que arrasa con una familia.' },
  { titulo: 'El diario de Noah', autor: 'Nicholas Sparks', isbn: '978-8499081609', categoria: 'Romance', precio: 260, stock: 22, descripcion: 'Un amor que sobrevive al paso del tiempo.' },
  { titulo: 'Un lugar donde refugiarse', autor: 'Nicholas Sparks', isbn: '978-8499085098', categoria: 'Romance', precio: 270, stock: 18, descripcion: 'Una mujer misteriosa llega a un pueblo tranquilo.' },
  { titulo: 'Yo antes de ti', autor: 'Jojo Moyes', isbn: '978-8420412220', categoria: 'Romance', precio: 280, stock: 25, destacado: true, descripcion: 'Louisa cuida de Will, un joven tetraplejico.' },
  { titulo: 'Rojo, blanco y sangre azul', autor: 'Casey McQuiston', isbn: '978-8417851781', categoria: 'Romance', precio: 300, stock: 17, descripcion: 'El hijo de la presidenta y un principe se enamoran.' },
  { titulo: 'La cancion de Aquiles', autor: 'Madeline Miller', isbn: '978-8498388373', categoria: 'Romance', precio: 290, stock: 16, descripcion: 'El amor entre Patroclo y Aquiles en la guerra de Troya.' },

  // ---------- TECNOLOGIA ----------
  { titulo: 'Codigo limpio', autor: 'Robert C. Martin', isbn: '978-8441532109', categoria: 'Tecnologia', precio: 320, stock: 20, destacado: true, descripcion: 'Manual de buenas practicas para escribir software legible.' },
  { titulo: 'El programador pragmatico', autor: 'Andrew Hunt', isbn: '978-8493713004', categoria: 'Tecnologia', precio: 300, stock: 18, descripcion: 'Consejos practicos para desarrolladores.' },
  { titulo: 'Clean Architecture', autor: 'Robert C. Martin', isbn: '978-0134494166', categoria: 'Tecnologia', precio: 340, stock: 16, descripcion: 'Diseno de arquitecturas de software mantenibles.' },
  { titulo: 'El lenguaje de programacion C', autor: 'Kernighan y Ritchie', isbn: '978-8480868600', categoria: 'Tecnologia', precio: 310, stock: 14, descripcion: 'El libro de referencia del lenguaje C.' },
  { titulo: 'Redes de computadoras', autor: 'Andrew Tanenbaum', isbn: '978-6073206054', categoria: 'Tecnologia', precio: 380, stock: 10, descripcion: 'La guia completa de redes informaticas.' },
  { titulo: 'Introduccion a los algoritmos', autor: 'Thomas Cormen', isbn: '978-8483225258', categoria: 'Tecnologia', precio: 420, stock: 8, descripcion: 'El libro de cabecera de estructuras de datos y algoritmos.' },
  { titulo: 'Python para todos', autor: 'Charles Severance', isbn: '978-1519801154', categoria: 'Tecnologia', precio: 250, stock: 24, descripcion: 'Introduccion practica a la programacion en Python.' },
  { titulo: 'Refactoring: Mejorando el diseno del codigo', autor: 'Martin Fowler', isbn: '978-8441535292', categoria: 'Tecnologia', precio: 350, stock: 12, descripcion: 'Como mejorar el codigo existente sin cambiar su comportamiento.' },
  { titulo: 'Inteligencia Artificial: Un enfoque moderno', autor: 'Stuart Russell', isbn: '978-8483225059', categoria: 'Tecnologia', precio: 400, stock: 9, descripcion: 'El tratado completo sobre inteligencia artificial.' }
];

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Conectado a MongoDB...');

  let insertados = 0;
  let existentes = 0;

  for (const libro of LIBROS) {
    const yaExiste = await Libro.findOne({ isbn: libro.isbn });
    if (yaExiste) {
      existentes++;
      continue;
    }
    await Libro.create(libro);
    insertados++;
  }

  const porCategoria = await Libro.aggregate([
    { $group: { _id: '$categoria', total: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  console.log('----------------------------------');
  console.log(`Insertados: ${insertados} | Ya existentes: ${existentes}`);
  console.log('Total por categoria:');
  porCategoria.forEach(c => console.log(`  ${c._id}: ${c.total}`));
  console.log('----------------------------------');

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
