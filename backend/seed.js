const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Administrador = require('./models/Administrador');
const Cliente = require('./models/Cliente');
const Libro = require('./models/Libro');
const Carrito = require('./models/Carrito');
const Venta = require('./models/Venta');
const Seguimiento = require('./models/Seguimiento');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/libreria_mern';

let semilla = 42;
function ran() { semilla += 1; const x = Math.sin(semilla) * 10000; return x - Math.floor(x); }
function aleatorioEntre(min, max) { return min + Math.floor(ran() * (max - min + 1)); }
function escoger(arr) { return arr[aleatorioEntre(0, arr.length - 1)]; }

const LIBROS = [
  { titulo: 'Cien Anos de Soledad', autor: 'Gabriel Garcia Marquez', isbn: '978-0307474728', categoria: 'Literatura', precio: 320, stock: 15, destacado: true, descripcion: 'La obra maestra del realismo magico latinoamericano.' },
  { titulo: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes', isbn: '978-8420412146', categoria: 'Literatura', precio: 280, stock: 12, destacado: true, descripcion: 'La historia del hidalgo que lucho contra molinos de viento.' },
  { titulo: 'Rayuela', autor: 'Julio Cortazar', isbn: '978-0307474730', categoria: 'Literatura', precio: 300, stock: 14, descripcion: 'La novela experimental mas iconica del boom latinoamericano.' },
  { titulo: 'Pedro Paramo', autor: 'Juan Rulfo', isbn: '978-0307474740', categoria: 'Literatura', precio: 240, stock: 10, descripcion: 'Una obra cumbre del realismo magico mexicano.' },
  { titulo: 'La Casa de los Espiritus', autor: 'Isabel Allende', isbn: '978-0307474750', categoria: 'Literatura', precio: 310, stock: 11, descripcion: 'Historia familiar entre realidad y magia.' },
  { titulo: 'El Aleph', autor: 'Jorge Luis Borges', isbn: '978-0307474760', categoria: 'Literatura', precio: 220, stock: 15, descripcion: 'Cuentos filosoficos y laberinticos.' },
  { titulo: 'Ficciones', autor: 'Jorge Luis Borges', isbn: '978-0307474770', categoria: 'Literatura', precio: 230, stock: 13, descripcion: 'Relatos breves de extraordinaria profundidad.' },
  { titulo: 'La Metamorfosis', autor: 'Franz Kafka', isbn: '978-0307474780', categoria: 'Literatura', precio: 190, stock: 18, descripcion: 'La transformacion inquietante de Gregorio Samsa.' },
  { titulo: 'Crimen y Castigo', autor: 'Fiodor Dostoievski', isbn: '978-0307474790', categoria: 'Literatura', precio: 280, stock: 9, descripcion: 'El dilema moral entre el crimen y la culpa.' },
  { titulo: 'Matar a un Ruisenor', autor: 'Harper Lee', isbn: '978-0307474800', categoria: 'Literatura', precio: 260, stock: 12, descripcion: 'La injusticia racial vista por una nina.' },
  { titulo: 'Ensayo sobre la Ceguera', autor: 'Jose Saramago', isbn: '978-0307474810', categoria: 'Literatura', precio: 290, stock: 13, descripcion: 'Una epidemia de ceguera como metafora social.' },
  { titulo: 'Harry Potter y la Piedra Filosofal', autor: 'J.K. Rowling', isbn: '978-8478884452', categoria: 'Fantasia', precio: 350, stock: 20, destacado: true, descripcion: 'El inicio de la saga del nino mago mas famoso.' },
  { titulo: 'El Senor de los Anillos', autor: 'J.R.R. Tolkien', isbn: '978-8445000663', categoria: 'Fantasia', precio: 450, stock: 10, destacado: true, descripcion: 'La epica aventura por la Tierra Media.' },
  { titulo: 'El Hobbit', autor: 'J.R.R. Tolkien', isbn: '978-0307474820', categoria: 'Fantasia', precio: 420, stock: 12, descripcion: 'La primera aventura de Bilbo Bolson.' },
  { titulo: 'El Nombre del Viento', autor: 'Patrick Rothfuss', isbn: '978-0307474830', categoria: 'Fantasia', precio: 380, stock: 16, descripcion: 'Los inicios de Kvothe, el relojero legendario.' },
  { titulo: 'Mistborn: El Imperio Final', autor: 'Brandon Sanderson', isbn: '978-0307474840', categoria: 'Fantasia', precio: 360, stock: 14, descripcion: 'Una heist magica en un imperio milenario.' },
  { titulo: 'Las Cronicas de Narnia', autor: 'C.S. Lewis', isbn: '978-0307474850', categoria: 'Fantasia', precio: 410, stock: 11, descripcion: 'El armario y el mundo de Aslan.' },
  { titulo: 'El Ladron del Rayo', autor: 'Rick Riordan', isbn: '978-0307474860', categoria: 'Fantasia', precio: 320, stock: 19, descripcion: 'Percy Jackson y los dioses del Olimpo.' },
  { titulo: 'American Gods', autor: 'Neil Gaiman', isbn: '978-0307474870', categoria: 'Fantasia', precio: 370, stock: 15, descripcion: 'Dioses antiguos en la America moderna.' },
  { titulo: 'Un Mundo Feliz', autor: 'Aldous Huxley', isbn: '978-0307474880', categoria: 'Ciencia Ficcion', precio: 250, stock: 17, descripcion: 'La distopia de la felicidad controlada.' },
  { titulo: 'Fahrenheit 451', autor: 'Ray Bradbury', isbn: '978-0307474890', categoria: 'Ciencia Ficcion', precio: 240, stock: 20, descripcion: 'La sociedad que quema libros.' },
  { titulo: '1984', autor: 'George Orwell', isbn: '978-0451524935', categoria: 'Ciencia Ficcion', precio: 260, stock: 18, descripcion: 'La distopia de la vigilancia totalitaria.' },
  { titulo: 'Dune', autor: 'Frank Herbert', isbn: '978-8499080239', categoria: 'Ciencia Ficcion', precio: 390, stock: 14, descripcion: 'La saga del planeta desierto Arrakis.' },
  { titulo: 'Fundacion', autor: 'Isaac Asimov', isbn: '978-8499087597', categoria: 'Ciencia Ficcion', precio: 310, stock: 16, descripcion: 'La psicohistoria y el imperio galactico.' },
  { titulo: 'El Fin de la Eternidad', autor: 'Isaac Asimov', isbn: '978-0307474900', categoria: 'Ciencia Ficcion', precio: 300, stock: 15, descripcion: 'El control del tiempo por la eternidad.' },
  { titulo: 'Neuromante', autor: 'William Gibson', isbn: '978-0307474910', categoria: 'Ciencia Ficcion', precio: 320, stock: 13, descripcion: 'El ciberpunk que cambio el genero.' },
  { titulo: 'El Juego de Ender', autor: 'Orson Scott Card', isbn: '978-0307474920', categoria: 'Ciencia Ficcion', precio: 310, stock: 17, descripcion: 'Ender y la escuela de combate espacial.' },
  { titulo: 'Guia del Viajero Intergalactico', autor: 'Douglas Adams', isbn: '978-0307474930', categoria: 'Ciencia Ficcion', precio: 290, stock: 20, descripcion: 'El humorico viaje por la galaxia.' },
  { titulo: 'Solaris', autor: 'Stanislaw Lem', isbn: '978-0307474940', categoria: 'Ciencia Ficcion', precio: 260, stock: 11, descripcion: 'El planeta en la frontera del conocimiento.' },
  { titulo: '2001 Una Odisea del Espacio', autor: 'Arthur C. Clarke', isbn: '978-0307474950', categoria: 'Ciencia Ficcion', precio: 330, stock: 9, descripcion: 'La IA HAL y el viaje a las lunas de Jupiter.' },
  { titulo: 'Historia de dos Ciudades', autor: 'Charles Dickens', isbn: '978-8420672344', categoria: 'Historia', precio: 220, stock: 9, descripcion: 'La revolucion francesa contada por Dickens.' },
  { titulo: 'Sapiens: De Animales a Dioses', autor: 'Yuval Noah Harari', isbn: '978-8499926223', categoria: 'Historia', precio: 380, stock: 22, destacado: true, descripcion: 'Una breve historia de la humanidad.' },
  { titulo: 'Guns Germenes y Acero', autor: 'Jared Diamond', isbn: '978-0307474960', categoria: 'Historia', precio: 400, stock: 9, descripcion: 'Las raices del poder de las civilizaciones.' },
  { titulo: 'Imperio Mongol', autor: 'Jack Weatherford', isbn: '978-0307474970', categoria: 'Historia', precio: 340, stock: 10, descripcion: 'El imperio mas extenso de la historia.' },
  { titulo: 'La Conquista de Mexico', autor: 'Hugh Thomas', isbn: '978-0307474980', categoria: 'Historia', precio: 380, stock: 8, descripcion: 'El encuentro entre dos mundos.' },
  { titulo: 'Breve Historia de casi Todo', autor: 'Bill Bryson', isbn: '978-0307474990', categoria: 'Historia', precio: 320, stock: 14, descripcion: 'Un paseo por la historia del planeta.' },
  { titulo: '1491', autor: 'Charles C. Mann', isbn: '978-0307475000', categoria: 'Historia', precio: 350, stock: 12, descripcion: 'Las Americas antes de Colones.' },
  { titulo: 'El Imperio Inca', autor: 'Terence N. D\'Altroy', isbn: '978-0307475010', categoria: 'Historia', precio: 310, stock: 11, descripcion: 'El gran imperio andino.' },
  { titulo: 'La Revolucion Francesa', autor: 'Simon Schama', isbn: '978-0307475020', categoria: 'Historia', precio: 330, stock: 10, descripcion: 'La era de la revolucion en Francia.' },
  { titulo: 'El Poder del Ahora', autor: 'Eckhart Tolle', isbn: '978-8479537520', categoria: 'Autoayuda', precio: 240, stock: 25, descripcion: 'Una guia para la iluminacion espiritual.' },
  { titulo: 'Habitos Atomicos', autor: 'James Clear', isbn: '978-8418112070', categoria: 'Autoayuda', precio: 290, stock: 28, destacado: true, descripcion: 'Como crear habitos pequenos con grandes resultados.' },
  { titulo: 'Piense y Hagase Rico', autor: 'Napoleon Hill', isbn: '978-0307475030', categoria: 'Autoayuda', precio: 230, stock: 30, descripcion: 'Los principios del exito financiero.' },
  { titulo: 'El Hombre en Busca del Sentido', autor: 'Viktor Frankl', isbn: '978-0307475040', categoria: 'Autoayuda', precio: 250, stock: 24, descripcion: 'La logica del sufrimiento y el sentido.' },
  { titulo: 'Como Ganar Amigos e Influir', autor: 'Dale Carnegie', isbn: '978-0307475050', categoria: 'Autoayuda', precio: 270, stock: 22, descripcion: 'Las claves de las relaciones humanas.' },
  { titulo: 'Los 7 Habitos de la Gente Altamente Efectiva', autor: 'Stephen Covey', isbn: '978-0307475060', categoria: 'Autoayuda', precio: 290, stock: 26, descripcion: 'Habitos para la eficacia personal.' },
  { titulo: 'El Alquimista', autor: 'Paulo Coelho', isbn: '978-0307475070', categoria: 'Autoayuda', precio: 210, stock: 35, descripcion: 'El viaje del joven Santiago en busca de su tesoro.' },
  { titulo: 'La Magia del Orden', autor: 'Marie Kondo', isbn: '978-0307475080', categoria: 'Autoayuda', precio: 210, stock: 21, descripcion: 'Ordena tu casa y cambia tu vida.' },
  { titulo: 'Mindset: La Actitud del Exito', autor: 'Carol Dweck', isbn: '978-0307475090', categoria: 'Autoayuda', precio: 260, stock: 19, descripcion: 'La mentalidad que define nuestro destino.' },
  { titulo: 'Orgullo y Prejuicio', autor: 'Jane Austen', isbn: '978-8491052977', categoria: 'Romance', precio: 210, stock: 11, descripcion: 'El clasico de la literatura inglesa.' },
  { titulo: 'Bajo la Misma Estrella', autor: 'John Green', isbn: '978-0307594839', categoria: 'Romance', precio: 250, stock: 17, descripcion: 'Una historia de amor y enfermedad.' },
  { titulo: 'Antes de Ti', autor: 'Jojo Moyes', isbn: '978-0307475100', categoria: 'Romance', precio: 260, stock: 18, descripcion: 'El amor frente a lo imposible.' },
  { titulo: 'Eleanor y Park', autor: 'Rainbow Rowell', isbn: '978-0307475110', categoria: 'Romance', precio: 240, stock: 16, descripcion: 'Dos adolescentes y una historia de amor.' },
  { titulo: 'El Amor en los Tiempos del Colera', autor: 'Gabriel Garcia Marquez', isbn: '978-0307475120', categoria: 'Romance', precio: 280, stock: 20, descripcion: 'Un amor que espero toda una vida.' },
  { titulo: 'Cumbres Borrascosas', autor: 'Emily Bronte', isbn: '978-0307475130', categoria: 'Romance', precio: 230, stock: 14, descripcion: 'La pasion destructiva entre Heathcliff y Catherine.' },
  { titulo: 'Jane Eyre', autor: 'Charlotte Bronte', isbn: '978-0307475140', categoria: 'Romance', precio: 220, stock: 13, descripcion: 'La historia de una joven independiente.' },
  { titulo: 'Persuasion', autor: 'Jane Austen', isbn: '978-0307475150', categoria: 'Romance', precio: 215, stock: 12, descripcion: 'Segunda oportunidad para el amor.' },
  { titulo: 'Matilda', autor: 'Roald Dahl', isbn: '978-8420464534', categoria: 'Infantil', precio: 180, stock: 20, descripcion: 'Una nina con poderes extraordinarios.' },
  { titulo: 'El Principito', autor: 'Antoine de Saint-Exupery', isbn: '978-0156012195', categoria: 'Infantil', precio: 150, stock: 30, destacado: true, descripcion: 'Un clasico sobre la amistad y el amor.' },
  { titulo: 'Charlie y la Fabrica de Chocolate', autor: 'Roald Dahl', isbn: '978-0307475160', categoria: 'Infantil', precio: 200, stock: 25, descripcion: 'La fabulosa historia de Charlie y Willy Wonka.' },
  { titulo: 'Alicia en el Pais de las Maravillas', autor: 'Lewis Carroll', isbn: '978-0307475170', categoria: 'Infantil', precio: 190, stock: 22, descripcion: 'Un mundo de fantasmas y absurdos.' },
  { titulo: 'Peter Pan', autor: 'J.M. Barrie', isbn: '978-0307475180', categoria: 'Infantil', precio: 170, stock: 20, descripcion: 'El nino que no queria crecer.' },
  { titulo: 'El Mago de Oz', autor: 'L. Frank Baum', isbn: '978-0307475190', categoria: 'Infantil', precio: 175, stock: 23, descripcion: 'El camino amarillo de Dorothy.' },
  { titulo: 'Heidi', autor: 'Johanna Spyri', isbn: '978-0307475200', categoria: 'Infantil', precio: 165, stock: 24, descripcion: 'Una nina de los Alpes y su abuelo.' },
  { titulo: 'Las Aventuras de Tom Sawyer', autor: 'Mark Twain', isbn: '978-0307475210', categoria: 'Infantil', precio: 180, stock: 18, descripcion: 'Las travesuras de Tom a orillas del Misisipi.' },
  { titulo: 'La Telaraña de Charlotte', autor: 'E.B. White', isbn: '978-0307475220', categoria: 'Infantil', precio: 170, stock: 19, descripcion: 'La amistad entre una cerdita y una araña.' },
  { titulo: 'Donde Viven los Monstruos', autor: 'Maurice Sendak', isbn: '978-0307475230', categoria: 'Infantil', precio: 160, stock: 21, descripcion: 'Max y el reino de los monstruos.' },
  { titulo: 'Inteligencia Artificial para Todos', autor: 'Stuart Russell', isbn: '978-8499923400', categoria: 'Tecnologia', precio: 340, stock: 13, descripcion: 'Introduccion accesible al mundo de la IA.' },
  { titulo: 'Codigo Limpio', autor: 'Robert C. Martin', isbn: '978-0307475240', categoria: 'Tecnologia', precio: 360, stock: 15, descripcion: 'Buenas practicas del desarrollo de software.' },
  { titulo: 'Programador Pragmatico', autor: 'Andrew Hunt', isbn: '978-0307475250', categoria: 'Tecnologia', precio: 340, stock: 13, descripcion: 'El oficio del desarrollador experimentado.' },
  { titulo: 'Patrones de Diseño', autor: 'Erich Gamma', isbn: '978-0307475260', categoria: 'Tecnologia', precio: 320, stock: 14, descripcion: 'Los patrones Gang of Four.' },
  { titulo: 'Aprendizaje Automatico', autor: 'Tom Mitchell', isbn: '978-0307475270', categoria: 'Tecnologia', precio: 380, stock: 11, descripcion: 'Fundamentos del machine learning.' },
  { titulo: 'Ciberseguridad en la Practica', autor: 'Paul Maier', isbn: '978-0307475280', categoria: 'Tecnologia', precio: 300, stock: 12, descripcion: 'Protege tus sistemas y datos.' },
  { titulo: 'Bases de Datos Modernas', autor: 'Susan Cruz', isbn: '978-0307475290', categoria: 'Tecnologia', precio: 310, stock: 16, descripcion: 'Del SQL clasico a las NoSQL.' },
  { titulo: 'El Disenio de Algoritmos', autor: 'Javier Zarca', isbn: '978-0307475300', categoria: 'Tecnologia', precio: 330, stock: 9, descripcion: 'Algoritmos para problemas reales.' },
  { titulo: 'Introduccion a los Algoritmos', autor: 'Thomas Cormen', isbn: '978-0307475310', categoria: 'Tecnologia', precio: 350, stock: 10, descripcion: 'El manual definitivo de algoritmos.' },
  { titulo: 'Buscando a Sigma', autor: 'Marcus Garrido', isbn: '978-0307475320', categoria: 'Tecnologia', precio: 290, stock: 10, descripcion: 'Analisis de datos y razonamiento estadistico.' },
  { titulo: 'El Codigo Da Vinci', autor: 'Dan Brown', isbn: '978-0307474278', categoria: 'Misterio', precio: 300, stock: 21, descripcion: 'Misterio, arte y conspiraciones.' },
  { titulo: 'La Chica del Tren', autor: 'Paula Hawkins', isbn: '978-8498386632', categoria: 'Misterio', precio: 270, stock: 8, descripcion: 'Un thriller psicologico adictivo.' },
  { titulo: 'Perdida', autor: 'Gillian Flynn', isbn: '978-0307475330', categoria: 'Misterio', precio: 300, stock: 12, descripcion: 'El thriller psicologico que todos recuerdan.' },
  { titulo: 'El Caso del Senor X', autor: 'Agatha Christie', isbn: '978-0307475340', categoria: 'Misterio', precio: 260, stock: 18, descripcion: 'Un enigma clasico de asesinato.' },
  { titulo: 'La Sombra del Viento', autor: 'Carlos Ruiz Zafon', isbn: '978-0307475350', categoria: 'Misterio', precio: 320, stock: 21, descripcion: 'El cementerio de los libros olvidados.' },
  { titulo: 'El Hombre Sombra', autor: 'Patricia Cornwell', isbn: '978-0307475360', categoria: 'Misterio', precio: 280, stock: 10, descripcion: 'El forense y la novela policial.' },
  { titulo: 'La Verdad sobre el Caso Harry Quebert', autor: 'Joel Dicker', isbn: '978-0307475370', categoria: 'Misterio', precio: 310, stock: 11, descripcion: 'Un misterio que abarca decadas.' },
  { titulo: 'En Tela de Juicio', autor: 'Scott Turow', isbn: '978-0307475380', categoria: 'Misterio', precio: 275, stock: 13, descripcion: 'Un abogado defensor en un caso imposible.' },
  { titulo: 'El Silencio de los Corderos', autor: 'Thomas Harris', isbn: '978-0307475390', categoria: 'Misterio', precio: 330, stock: 8, descripcion: 'El agente del FBI y el canibal.' },
  { titulo: 'El Metodo del Origen', autor: 'Douglas Preston', isbn: '978-0307475400', categoria: 'Misterio', precio: 290, stock: 14, descripcion: 'Una teoria del todo que mata.' },
  { titulo: 'El Ruido y la Furia', autor: 'William Faulkner', isbn: '978-0307475410', categoria: 'Literatura', precio: 270, stock: 12, descripcion: 'La saga de los Compson.' },
  { titulo: 'Cumbres Borrascosas', autor: 'Emily Bronte', isbn: '978-0307475420', categoria: 'Romance', precio: 230, stock: 14, descripcion: 'La pasion destructiva entre Heathcliff y Catherine.' },
  { titulo: 'El Señor de los Anillos: Las Dos Torres', autor: 'J.R.R. Tolkien', isbn: '978-0307475430', categoria: 'Fantasia', precio: 440, stock: 10, descripcion: 'La continuacion de la epica aventura.' },
  { titulo: 'El Senor de los Anillos: El Retorno del Rey', autor: 'J.R.R. Tolkien', isbn: '978-0307475440', categoria: 'Fantasia', precio: 460, stock: 9, descripcion: 'La batalla final por la Tierra Media.' },
  { titulo: 'Los Juegos del Hambre', autor: 'Suzanne Collins', isbn: '978-0307475450', categoria: 'Ciencia Ficcion', precio: 300, stock: 18, descripcion: 'La revolucion de los tributos.' },
  { titulo: 'En Llamas', autor: 'Suzanne Collins', isbn: '978-0307475460', categoria: 'Ciencia Ficcion', precio: 310, stock: 16, descripcion: 'La segunda parte de los juegos.' },
  { titulo: 'Rebelión en la Granja', autor: 'George Orwell', isbn: '978-0307475470', categoria: 'Literatura', precio: 180, stock: 25, descripcion: 'La alegoria de la revolucion animal.' },
{ titulo: 'El Proceso', autor: 'Franz Kafka', isbn: '978-0307475480', categoria: 'Literatura', precio: 200, stock: 20, descripcion: 'El hombre acusado de un crimen inexistente.' },
  { titulo: 'El Principito', autor: 'Antoine de Saint-Exupery', isbn: '978-0307475540', categoria: 'Infantil', precio: 150, stock: 30, destacado: true, descripcion: 'Un clasico sobre la amistad y el amor.' },
  { titulo: 'El Alquimista', autor: 'Paulo Coelho', isbn: '978-0307475490', categoria: 'Autoayuda', precio: 200, stock: 32, descripcion: 'La historia de Santiago y su tesoro.' },
  { titulo: 'Puntos de Quiebre', autor: 'Malcolm Gladwell', isbn: '978-0307475500', categoria: 'Autoayuda', precio: 250, stock: 18, descripcion: 'Los pequenos cambios que marcan la diferencia.' },
  { titulo: '1493', autor: 'Charles C. Mann', isbn: '978-0307475510', categoria: 'Historia', precio: 360, stock: 10, descripcion: 'Las Americas despues de Colones.' },
  { titulo: 'La Segunda Guerra Mundial', autor: 'Winston Churchill', isbn: '978-0307475520', categoria: 'Historia', precio: 420, stock: 7, descripcion: 'El relato del gran conflicto mundial.' },
  { titulo: 'El Senor de los Anillos: La Comunidad del Anillo', autor: 'J.R.R. Tolkien', isbn: '978-0307475530', categoria: 'Fantasia', precio: 470, stock: 8, descripcion: 'El inicio del viaje de Frodo.' }
];

console.log(`Total libros: ${LIBROS.length}`);

// ==================== CLIENTES ====================
const PROFESIONES = [
  { nombre: 'Estudiante', peso: 0.25, ingreso: 0.3 },
  { nombre: 'Docente', peso: 0.12, ingreso: 0.6 },
  { nombre: 'Ingeniero', peso: 0.10, ingreso: 0.85 },
  { nombre: 'Médico', peso: 0.08, ingreso: 0.9 },
  { nombre: 'Abogado', peso: 0.07, ingreso: 0.8 },
  { nombre: 'Arquitecto', peso: 0.05, ingreso: 0.82 },
  { nombre: 'Contador', peso: 0.05, ingreso: 0.7 },
  { nombre: 'Diseñador', peso: 0.04, ingreso: 0.55 },
  { nombre: 'Programador', peso: 0.04, ingreso: 0.75 },
  { nombre: 'Periodista', peso: 0.03, ingreso: 0.5 },
  { nombre: 'Chef', peso: 0.02, ingreso: 0.55 },
  { nombre: 'Psicólogo', peso: 0.03, ingreso: 0.65 },
  { nombre: 'Enfermero', peso: 0.03, ingreso: 0.45 },
  { nombre: 'Veterinario', peso: 0.02, ingreso: 0.55 },
  { nombre: 'Comerciante', peso: 0.02, ingreso: 0.4 },
  { nombre: 'Constructor', peso: 0.02, ingreso: 0.42 },
  { nombre: 'Electricista', peso: 0.015, ingreso: 0.35 },
  { nombre: 'Mecánico', peso: 0.015, ingreso: 0.32 },
  { nombre: 'Agricultor', peso: 0.01, ingreso: 0.25 },
  { nombre: 'Policía', peso: 0.01, ingreso: 0.45 },
  { nombre: 'Bombero', peso: 0.005, ingreso: 0.4 },
  { nombre: 'Otros', peso: 0.03, ingreso: 0.35 }
];

const NOMBRES_MASC = ['Carlos','José','Miguel','Luis','Pedro','Juan','Diego','Andrés','Santiago','Matías','Nicolás','Sebastián','Felipe','Alejandro','Daniel','Jorge','Roberto','Fernando','Hugo','Oscar','Eduardo','Mario','Alberto','Raúl','Tomás','Vicente','Emilio','Ricardo','Manuel','Gabriel','Javier','Marcos','Iván','Lucas','Brandon','Kevin','Samuel','Axel','Ronald','César','Adrián','Esteban','Pablo','Sergio','Arturo','Rodrigo','Ernesto','Gonzalo','Víctor','Marcelo','Claudio','Mauricio','Patricio','Héctor','Silvio','Oscar','Eugenio','Fausto','Leonardo','Andrés','Felipe','Tomás','Ramón','Julio','Augusto','Roberto','Miguel','José','Manuel','Alberto','Fernando','Sergio','Ricardo','Daniel','Jorge','Luis','Carlos','Diego','Juan','Pedro'];
const NOMBRES_FEM = ['María','Ana','Lucía','Carmen','Sofía','Valentina','Isabel','Camila','Fernanda','Daniela','Alejandra','Laura','Sofía','Antonella','Valeria','Renata','Emilia','Martina','Florencia','Constanza','Bárbara','Regina','Paola','Andrea','Roberta','Mónica','Patricia','Gloria','Rosa','Elena','Silvia','Beatriz','Lorena','Graciela','Verónica','Natalia','Carolina','Patricia','Gloria','Elena','Silvia','Beatriz','Lorena','María','Ana','Sofía','Camila','Valentina','Isabel','Fernanda','Daniela','Laura','Alejandra','Renata','Emilia','Martina','Florencia','Constanza','Bárbara','Regina','Paola','Andrea','Roberta','Mónica','Patricia','Gloria','Elena','Silvia','Beatriz','Lorena','Graciela','Rosa','Carmen','Lucía','Ana','María','Sofía','Camila','Valentina','Isabel','Fernanda','Daniela','Laura','Alejandra','Renata','Emilia','Martina','Florencia','Constanza','Bárbara','Regina','Paola','Andrea','Roberta','Mónica','Patricia','Gloria','Elena','Silvia','Beatriz','Lorena','Graciela','Rosa','Carmen'];
const APELLIDOS = ['García','Rodríguez','López','Martínez','González','Pérez','Sánchez','Ramírez','Torres','Flores','Rivera','Gómez','Díaz','Cruz','Morales','Ortiz','Vargas','Medina','Reyes','Castillo','Jiménez','Herrera','Mendoza','Chávez','Muñoz','Lara','Guerrero','Dominguez','Vega','Rangel','Cárdenas','Zamora','Salazar','Ibarra','Paredes','León','Vásquez','Molina','Peña','Romero','Barría','Soto','Contreras','Ávila','Núñez','Cortes','Silva','Pizarro','Figueroa','Garay','Bravo','Carrasco','Espinoza','Bustos','Ponce','Jara','Fuentes','Cabrera','Montero','Peralta','Barrera','Navarrete','Iglesias','Moreno','Prieto','Vidal','Martínez','Sánchez','López','García','Torres','Flores','Rivera','Gómez','Díaz','Cruz','Morales','Ortiz','Vargas','Medina','Reyes','Castillo','Jiménez','Herrera','Mendoza','Chávez','Muñoz','Lara','Guerrero'];
function nombreAleatorio() {
  const m = Math.random() < 0.5;
  const nombre = m ? escoger(NOMBRES_MASC) : escoger(NOMBRES_FEM);
  return `${nombre} ${escoger(APELLIDOS)} ${escoger(APELLIDOS)}`;
}

function elegirProfesion() {
  const r = ran();
  let acum = 0;
  for (const p of PROFESIONES) { acum += p.peso; if (r <= acum) return p; }
  return PROFESIONES[0];
}

function edadParaProfesion(prof) {
  if (prof.nombre === 'Estudiante') return aleatorioEntre(18, 26);
  if (prof.nombre === 'Docente') return aleatorioEntre(25, 60);
  if (prof.nombre === 'Médico' || prof.nombre === 'Abogado') return aleatorioEntre(28, 65);
  if (prof.nombre === 'Ingeniero' || prof.nombre === 'Arquitecto') return aleatorioEntre(24, 55);
  return aleatorioEntre(20, 60);
}

function frecuenciaPara(edad, prof) {
  const r = ran();
  if (prof.nombre === 'Estudiante') return r < 0.4 ? 'A diario' : r < 0.75 ? 'Varias veces por semana' : r < 0.9 ? 'Semanal' : 'Mensual';
  if (edad < 25) return r < 0.3 ? 'A diario' : r < 0.6 ? 'Varias veces por semana' : r < 0.8 ? 'Semanal' : 'Mensual';
  if (edad < 40) return r < 0.2 ? 'A diario' : r < 0.5 ? 'Varias veces por semana' : r < 0.75 ? 'Semanal' : 'Mensual';
  if (edad < 60) return r < 0.15 ? 'A diario' : r < 0.45 ? 'Semanal' : r < 0.75 ? 'Mensual' : 'Casi nunca';
  return r < 0.1 ? 'Semanal' : r < 0.4 ? 'Mensual' : 'Casi nunca';
}

function categoriasPara(prof, edad) {
  const cats = [];
  if (prof.nombre === 'Estudiante') { cats.push('Fantasia','Ciencia Ficcion','Infantil'); if (ran() < 0.3) cats.push('Romance'); }
  else if (prof.nombre === 'Docente') { cats.push('Historia','Literatura','Autoayuda'); if (ran() < 0.3) cats.push('Ciencia Ficcion'); }
  else if (prof.nombre === 'Ingeniero' || prof.nombre === 'Programador') { cats.push('Tecnologia','Ciencia Ficcion','Autoayuda'); if (ran() < 0.3) cats.push('Misterio'); }
  else if (prof.nombre === 'Médico' || prof.nombre === 'Psicólogo') { cats.push('Autoayuda','Historia','Literatura'); if (ran() < 0.3) cats.push('Romance'); }
  else if (prof.nombre === 'Abogado') { cats.push('Historia','Literatura','Misterio'); if (ran() < 0.3) cats.push('Autoayuda'); }
  else if (prof.nombre === 'Arquitecto' || prof.nombre === 'Diseñador') { cats.push('Literatura','Fantasia'); if (ran() < 0.3) cats.push('Tecnologia'); }
  else if (prof.nombre === 'Contador') { cats.push('Autoayuda','Historia'); if (ran() < 0.3) cats.push('Literatura'); }
  else if (prof.nombre === 'Periodista') { cats.push('Historia','Literatura','Misterio'); if (ran() < 0.3) cats.push('Ciencia Ficcion'); }
  else if (prof.nombre === 'Chef') { cats.push('Historia','Literatura'); if (ran() < 0.3) cats.push('Autoayuda'); }
  else { cats.push('Literatura','Historia','Autoayuda'); if (ran() < 0.3) cats.push('Fantasia'); }
  if (cats.length < 3) { const extra = ['Literatura','Fantasia','Ciencia Ficcion','Historia','Autoayuda','Romance','Infantil','Tecnologia','Misterio'].filter(c => !cats.includes(c)); if (extra.length) cats.push(escoger(extra)); }
  return cats.slice(0, 3);
}

function autoresPara(categorias) {
  const poolAutores = {
    Literatura: ['Gabriel Garcia Marquez','Miguel de Cervantes','Julio Cortazar','Juan Rulfo','Isabel Allende','Jorge Luis Borges','Jose Saramago','Franz Kafka','Fiodor Dostoievski','Harper Lee'],
    Fantasia: ['J.K. Rowling','J.R.R. Tolkien','Patrick Rothfuss','Brandon Sanderson','C.S. Lewis','Rick Riordan','Neil Gaiman','George R.R. Martin','Robin Hobb','Terry Pratchett'],
    'Ciencia Ficcion': ['Isaac Asimov','Frank Herbert','George Orwell','Arthur C. Clarke','Orson Scott Card','Douglas Adams','Stanislaw Lem','William Gibson','Aldous Huxley','Ray Bradbury'],
    Historia: ['Yuval Noah Harari','Jared Diamond','Hugh Thomas','Bill Bryson','Charles Dickens','Jack Weatherford','Simon Schama','Charles C. Mann','Terence D\'Altroy','José Saramago'],
    Autoayuda: ['Eckhart Tolle','James Clear','Napoleon Hill','Viktor Frankl','Dale Carnegie','Stephen Covey','Paulo Coelho','Marie Kondo','Carol Dweck','Malcolm Gladwell'],
    Romance: ['Jane Austen','Gabriel Garcia Marquez','Jojo Moyes','Rainbow Rowell','John Green','Emily Bronte','Charlotte Bronte','Mark Twain','Paulo Coelho','Isabel Allende'],
    Infantil: ['Roald Dahl','Lewis Carroll','J.M. Barrie','Mark Twain','L. Frank Baum','Johanna Spyri','E.B. White','Maurice Sendak','Dr. Seuss','Julia Donaldson'],
    Tecnologia: ['Stuart Russell','Robert C. Martin','Andrew Hunt','Erich Gamma','Tom Mitchell','Paul Maier','Susan Cruz','Javier Zarca','Marcus Garrido','Thomas Cormen'],
    Misterio: ['Dan Brown','Agatha Christie','Carlos Ruiz Zafon','Gillian Flynn','Patricia Cornwell','Arthur Conan Doyle','Edgar Allan Poe','Raymond Chandler','Joel Dicker','Thomas Harris']
  };
  const autores = [];
  categorias.forEach(cat => {
    const pool = poolAutores[cat] || poolAutores['Literatura'];
    const n = aleatorioEntre(1, 3);
    for (let i = 0; i < n; i++) { const a = escoger(pool); if (!autores.includes(a)) autores.push(a); }
  });
  return autores.slice(0, 3);
}

const CLIENTES = [];
for (let i = 0; i < 1000; i++) {
  const prof = elegirProfesion();
  const edad = edadParaProfesion(prof);
  const freq = frecuenciaPara(edad, prof);
  const cats = categoriasPara(prof, edad);
  const auts = autoresPara(cats);
  CLIENTES.push({
    nombre: nombreAleatorio(),
    email: `cliente${i + 1}@cliente.com`,
    celular: `099${String(i + 1).padStart(7, '0')}`,
    password: 'cliente123',
    profesion: prof.nombre,
    edad,
    frecuenciaLectura: freq,
    preferenciasCategorias: cats,
    autores: auts
  });
}

// ==================== SIMULACION DE COMPRAS ====================
function simularCompras(cliente, librosPorCategoria) {
  const cfgVolumen = {
    'A diario': { ventas: aleatorioEntre(3, 6), maxItems: 3 },
    'Varias veces por semana': { ventas: aleatorioEntre(2, 4), maxItems: 3 },
    'Semanal': { ventas: aleatorioEntre(1, 3), maxItems: 2 },
    'Mensual': { ventas: aleatorioEntre(1, 2), maxItems: 2 },
    'Casi nunca': { ventas: aleatorioEntre(0, 1), maxItems: 1 }
  };
  const c = cfgVolumen[cliente.frecuenciaLectura] || cfgVolumen['Mensual'];
  const cats = cliente.preferenciasCategorias || [];
  const auts = cliente.autores || [];
  const candidatos = [];
  cats.forEach(cat => { (librosPorCategoria[cat] || []).forEach(l => candidatos.push(l)); });
  auts.forEach(a => { candidatos.forEach(l => { if (l.autor === a && !candidatos.includes(l)) candidatos.push(l); }); });
  const pool = candidatos.length > 0 ? candidatos : librosPorCategoria['Literatura'] || [];
  const ventas = [];
  for (let v = 0; v < c.ventas; v++) {
    const nItems = aleatorioEntre(1, c.maxItems);
    const items = [];
    for (let i = 0; i < nItems; i++) {
      const libro = pool[aleatorioEntre(0, pool.length - 1)];
      const cantidad = aleatorioEntre(1, 3);
      items.push({ libro: libro._id, titulo: libro.titulo, autor: libro.autor, categoria: libro.categoria, portada: libro.portada, precio: libro.precio, cantidad });
    }
    const total = items.reduce((s, it) => s + it.precio * it.cantidad, 0);
    const estados = ['Pagada', 'Pagada', 'Pagada', 'Pendiente', 'Cancelada'];
    ventas.push({ items, total, estado: escoger(estados) });
  }
  return ventas;
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Conectado a MongoDB. Limpiando colecciones...');

    await Promise.all([
      Administrador.deleteMany({}),
      Cliente.deleteMany({}),
      Libro.deleteMany({}),
      Carrito.deleteMany({}),
      Venta.deleteMany({}),
      Seguimiento.deleteMany({})
    ]);

    const hashAdmin = await bcrypt.hash('admin123', 10);
    await Administrador.create({ nombre: 'Administrador Principal', email: 'admin@libreria.com', password: hashAdmin });

    await Libro.insertMany(LIBROS);
    const libros = await Libro.find();
    const librosPorCategoria = {};
    libros.forEach(l => { if (!librosPorCategoria[l.categoria]) librosPorCategoria[l.categoria] = []; librosPorCategoria[l.categoria].push(l); });
    console.log(`  ${libros.length} libros cargados (${Object.keys(librosPorCategoria).length} categorias)`);

    const hashCli = await bcrypt.hash('cliente123', 10);
    const clientes = await Cliente.insertMany(CLIENTES.map(c => ({ ...c, password: hashCli })));
    console.log(`  ${clientes.length} clientes creados`);

    let totalVentas = 0;
    let totalGasto = 0;
    for (const cliente of clientes) {
      const ventas = simularCompras(cliente, librosPorCategoria);
      if (ventas.length === 0) continue;
      const compras = [];
      const gustosTally = {};
      let gastoTotal = 0;

      for (const v of ventas) {
        const creada = await Venta.create({
          cliente: cliente._id, nombreCliente: cliente.nombre, items: v.items, total: v.total, estado: v.estado
        });
        if (creada.estado !== 'Cancelada') {
          for (const it of v.items) {
            await Libro.findByIdAndUpdate(it.libro, { $inc: { stock: -it.cantidad } });
            gastoTotal += it.precio * it.cantidad;
          }
        }
        compras.push({ venta: creada._id, total: creada.total, fecha: creada.fecha, estado: creada.estado });
        v.items.forEach(it => { gustosTally[it.categoria] = (gustosTally[it.categoria] || 0) + it.cantidad; });
      }
      totalVentas += ventas.length;
      totalGasto += gastoTotal;

      const gustos = ventas.map(v => v.items).flat().slice(0, 4).map(i => ({
        libro: i.libro, titulo: i.titulo, categoria: i.categoria, autor: i.autor, portada: i.portada
      }));

      await Seguimiento.create({
        cliente: cliente._id,
        gustos,
        agregadosCarrito: ventas[0] ? ventas[0].items : [],
        preferenciasCategorias: Object.entries(gustosTally).map(([categoria, contador]) => ({ categoria, contador })),
        compras,
        gastoTotal,
        totalCompras: compras.filter(c => c.estado !== 'Cancelada').length
      });
    }

    console.log(`  ${totalVentas} ventas simuladas, gasto total: $${totalGasto.toFixed(2)}`);
    console.log('Accesos:');
    console.log('  Admin -> admin@libreria.com / admin123');
    console.log('  Cliente -> cliente1@cliente.com / cliente123 (y cliente2..cliente1000)');
    console.log('Seed completado exitosamente!');
  } catch (e) {
    console.error('Error en el seed:', e.message);
    console.error(e.stack);
  } finally {
    await mongoose.disconnect();
  }
}

seed();