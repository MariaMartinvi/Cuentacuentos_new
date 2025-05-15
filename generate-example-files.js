/**
 * Script para generar archivos de ejemplo para pruebas
 * 
 * Este script crea archivos de ejemplo en las carpetas temp/stories, temp/images y temp/audio
 * para probar la funcionalidad de subida a Firebase Storage
 */

const fs = require('fs');
const path = require('path');

// Contenido de ejemplo para los archivos de texto
const exampleStories = {
  'dragon-no-volar.txt': `El dragón que no podía volar

Había una vez un pequeño dragón llamado Puff que vivía en las montañas azules. A diferencia de otros dragones, Puff tenía un problema: no podía volar. Sus alas eran demasiado pequeñas y por más que lo intentaba, no lograba elevarse del suelo.

Todos los días, Puff observaba a los otros dragones volar alto en el cielo, haciendo piruetas y jugando entre las nubes. Se sentía muy triste porque quería jugar con ellos, pero no podía.

Un día, mientras caminaba por el bosque, Puff encontró a una pequeña niña que estaba perdida. La niña lloraba porque no podía encontrar el camino a su casa.

"No llores", le dijo Puff. "Yo te ayudaré a encontrar tu casa".

La niña se sorprendió al ver un dragón tan amable. Juntos caminaron por el bosque, y Puff usó su excelente sentido del olfato para seguir el rastro hasta la aldea donde vivía la niña.

Cuando llegaron, todos los habitantes del pueblo estaban asombrados. ¡Un dragón había ayudado a la niña! Estaban tan agradecidos que organizaron una gran fiesta para Puff.

Durante la fiesta, Puff se dio cuenta de algo importante: aunque no podía volar como los otros dragones, tenía otras habilidades especiales. Era amable, valiente y tenía un gran sentido del olfato que le permitía ayudar a los demás.

Desde ese día, Puff ya no se sintió triste por no poder volar. Había encontrado su propio camino para ser feliz y ayudar a los demás. Y así, el dragón que no podía volar se convirtió en el dragón más querido de todas las montañas azules.

Fin`,

  'princesa-valiente.txt': `La princesa valiente

Había una vez una princesa llamada Elena que vivía en un reino lejano. A diferencia de otras princesas, a Elena no le gustaban los vestidos elegantes ni las fiestas del palacio. Ella prefería explorar el bosque, trepar a los árboles y aprender a usar la espada.

El rey y la reina estaban preocupados por su hija. "Una princesa debe comportarse como tal", le decían. Pero Elena tenía otros planes.

Un día, un terrible dragón llegó al reino y comenzó a aterrorizar a los aldeanos. El rey envió a sus mejores caballeros para derrotar a la bestia, pero todos fallaron.

"Yo puedo derrotar al dragón", dijo Elena a su padre. El rey se rió. "Eres solo una niña", respondió. Pero Elena estaba decidida.

Esa noche, tomó la armadura de un caballero, una espada y partió hacia la cueva del dragón. Cuando llegó, no atacó de inmediato. En cambio, observó al dragón y notó algo extraño: tenía una espina clavada en su pata que le causaba dolor.

Con mucho cuidado, Elena se acercó al dragón. "No te haré daño", le dijo. "Quiero ayudarte". El dragón, aunque asustado, permitió que Elena le quitara la espina.

El dragón estaba tan agradecido que prometió no volver a molestar al reino. Elena regresó al castillo montada sobre el lomo del dragón, sorprendiendo a todos.

El rey y la reina finalmente entendieron que su hija era valiente y sabia a su manera. Desde ese día, Elena fue conocida como la princesa valiente, y cuando creció, se convirtió en la mejor gobernante que el reino había tenido jamás.

Fin`,

  'aventura-espacial.txt': `Aventura en el espacio

En un futuro lejano, había una niña llamada Luna que soñaba con viajar por el espacio. Todas las noches, antes de dormir, miraba por la ventana de su habitación y observaba las estrellas, imaginando cómo sería visitarlas.

Luna estudiaba mucho sobre astronomía y naves espaciales. Construía modelos de cohetes con materiales reciclados y simulaba misiones a otros planetas en el patio de su casa.

Un día, cuando Luna tenía 12 años, su escuela anunció un concurso de ciencias. El ganador tendría la oportunidad de visitar la Estación Espacial Internacional. Luna trabajó día y noche en su proyecto: un sistema para cultivar plantas en gravedad cero usando menos recursos.

Cuando llegó el día del concurso, Luna estaba nerviosa pero emocionada. Presentó su proyecto con pasión y respondió todas las preguntas del jurado con confianza. Semanas después, recibió la noticia: ¡había ganado!

El día del lanzamiento, Luna no podía creer que su sueño se estaba haciendo realidad. Cuando el cohete despegó, sintió una mezcla de miedo y emoción. A medida que la nave se alejaba de la Tierra, Luna vio nuestro planeta como un hermoso globo azul.

En la estación espacial, Luna realizó experimentos con su sistema de cultivo y ayudó a los astronautas en sus tareas diarias. Incluso tuvo la oportunidad de hacer un paseo espacial, flotando en la inmensidad del cosmos mientras contemplaba la Tierra desde lejos.

Cuando regresó a casa, Luna sabía exactamente lo que quería hacer con su vida: convertirse en astronauta y explorar el universo. Y años más tarde, lo logró, liderando la primera misión tripulada a Marte.

Luna demostró que con pasión, dedicación y trabajo duro, incluso los sueños más grandes pueden hacerse realidad.

Fin`
};

// Función para crear un directorio si no existe
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Directorio creado: ${dirPath}`);
  }
}

// Función para crear un archivo de texto
function createTextFile(dirPath, filename, content) {
  const filePath = path.join(dirPath, filename);
  fs.writeFileSync(filePath, content);
  console.log(`Archivo de texto creado: ${filePath}`);
}

// Función para crear un archivo de imagen de prueba
function createTestImage(dirPath, filename, width = 400, height = 300) {
  // Crear un buffer con datos de una imagen PNG simple
  // Este es un PNG mínimo válido con un píxel rojo
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB0, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  const filePath = path.join(dirPath, filename);
  fs.writeFileSync(filePath, pngHeader);
  console.log(`Archivo de imagen de prueba creado: ${filePath}`);
}

// Función para crear un archivo de audio de prueba
function createTestAudio(dirPath, filename) {
  // Crear un buffer con datos mínimos para un archivo MP3 válido
  // Esto es solo un encabezado MP3 básico, no reproducirá sonido real
  const mp3Header = Buffer.from([
    0xFF, 0xFB, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
  
  // Repetir el encabezado para crear un archivo más grande
  const buffer = Buffer.concat([mp3Header, mp3Header, mp3Header, mp3Header]);
  
  const filePath = path.join(dirPath, filename);
  fs.writeFileSync(filePath, buffer);
  console.log(`Archivo de audio de prueba creado: ${filePath}`);
}

// Función principal para generar todos los archivos de ejemplo
function generateExampleFiles() {
  console.log('=== GENERANDO ARCHIVOS DE EJEMPLO PARA PRUEBAS ===\n');
  
  // Crear directorios
  const baseDir = path.join(__dirname, 'temp');
  const storiesDir = path.join(baseDir, 'stories');
  const imagesDir = path.join(baseDir, 'images');
  const audioDir = path.join(baseDir, 'audio');
  
  ensureDirectoryExists(baseDir);
  ensureDirectoryExists(storiesDir);
  ensureDirectoryExists(imagesDir);
  ensureDirectoryExists(audioDir);
  
  // Crear archivos de historias
  console.log('\n📚 Creando archivos de historias...');
  for (const [filename, content] of Object.entries(exampleStories)) {
    createTextFile(storiesDir, filename, content);
  }
  
  // Crear archivos de imágenes de prueba
  console.log('\n🖼️ Creando archivos de imágenes de prueba...');
  createTestImage(imagesDir, 'dragon.png');
  createTestImage(imagesDir, 'princesa.png');
  createTestImage(imagesDir, 'espacio.png');
  createTestImage(imagesDir, 'castillo.png');
  createTestImage(imagesDir, 'bosque.png');
  
  // Crear archivos de audio de prueba
  console.log('\n🔊 Creando archivos de audio de prueba...');
  createTestAudio(audioDir, 'dragon-no-volar.mp3');
  createTestAudio(audioDir, 'princesa-valiente.mp3');
  createTestAudio(audioDir, 'aventura-espacial.mp3');
  
  console.log('\n✅ Generación de archivos de ejemplo completada');
  console.log(`\nDirectorios creados:`);
  console.log(`- Historias: ${storiesDir}`);
  console.log(`- Imágenes: ${imagesDir}`);
  console.log(`- Audio: ${audioDir}`);
}

// Ejecutar la función principal
generateExampleFiles(); 