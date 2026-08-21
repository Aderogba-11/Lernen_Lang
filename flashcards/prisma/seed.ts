import "dotenv/config";
import { Prisma } from "../app/generated/prisma/client";
import { db } from "../lib/db";

const LANGUAGES = [
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "zh", name: "Mandarin", nativeName: "中文" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
];

const LEVELS = [
  { code: "A1", name: "Beginner", order: 1 },
  { code: "A2", name: "Elementary", order: 2 },
  { code: "B1", name: "Intermediate", order: 3 },
  { code: "B2", name: "Upper-intermediate", order: 4 },
  { code: "C1", name: "Advanced", order: 5 },
  { code: "C2", name: "Proficient", order: 6 },
];

type ExerciseSeed = {
  type: string;
  prompt: string;
  content: Prisma.InputJsonValue;
  answer: Prisma.InputJsonValue;
};

type LessonSeed = {
  title: string;
  objective: string;
  notes: string;
  exercises: ExerciseSeed[];
};

type ModuleSeed = {
  title: string;
  description: string;
  lessons: LessonSeed[];
};

const translation = (source: string, expected: string, accept: string[] = []): ExerciseSeed => ({
  type: "WRITING",
  prompt: `Translate to Spanish: ${source}`,
  content: { kind: "translation", source },
  answer: { expected, accept },
});

const fillBlank = (sentence: string, hint: string, expected: string, accept: string[] = []): ExerciseSeed => ({
  type: "WRITING",
  prompt: `Fill in the blank: ${sentence} (${hint})`,
  content: { kind: "fill-blank", sentence, hint },
  answer: { expected, accept },
});

const wordOrder = (words: string[], expected: string): ExerciseSeed => ({
  type: "WRITING",
  prompt: `Put the words in order: ${words.join(" / ")}`,
  content: { kind: "word-order", words },
  answer: { expected },
});

const MODULES: ModuleSeed[] = [
  {
    title: "Foundations",
    description: "Greetings, introducing yourself, basic questions",
    lessons: [
      {
        title: "Greetings",
        objective:
          "Greet people appropriately at different times of day and say goodbye.",
        notes:
          "Buenos días = good morning (until midday); buenas tardes = good afternoon; buenas noches = evening/night. Hola works at any time. Adiós and hasta luego both mean goodbye.",
        exercises: [
          translation("Good morning", "Buenos días", ["Buenos dias"]),
          fillBlank("___ noches.", "said when going to bed", "Buenas"),
          wordOrder(["Buenas", "noches", "señor"], "Buenas noches señor"),
        ],
      },
      {
        title: "Introducing Yourself",
        objective: "Tell someone your name and ask who they are.",
        notes:
          "Use 'Me llamo …' or 'Soy …' to give your name. '¿Cómo te llamas?' asks someone's name informally; '¿Cómo se llama usted?' is the polite form.",
        exercises: [
          translation("My name is Ana", "Me llamo Ana", ["Me llamo ana"]),
          fillBlank("¿Cómo ___ llamas?", "informal you", "te"),
          wordOrder(["Soy", "de", "España"], "Soy de España"),
        ],
      },
      {
        title: "Basic Questions",
        objective: "Ask and answer simple everyday questions.",
        notes:
          "Question words: ¿qué? what · ¿dónde? where · ¿cómo? how · ¿cuánto? how much. Written questions open with ¿. '¿De dónde eres?' = Where are you from?",
        exercises: [
          translation("Where are you from?", "¿De dónde eres?", ["De donde eres"]),
          fillBlank("¿Dónde ___ el baño?", "it is (location)", "está"),
          wordOrder(["¿Cómo", "estás", "hoy?"], "¿Cómo estás hoy?"),
        ],
      },
    ],
  },
  {
    title: "Numbers and Time",
    description: "Numbers, days and months, telling time",
    lessons: [
      {
        title: "Numbers 0–31",
        objective: "Count from 0 to 31 and use numbers in simple contexts.",
        notes:
          "1 uno · 2 dos · 3 tres · 4 cuatro · 5 cinco · 6 seis · 7 siete · 8 ocho · 9 nueve · 10 diez · 11 once · 12 doce · 13 trece · 14 catorce · 15 quince · 16 dieciséis · 17 diecisiete · 18 dieciocho · 19 diecinueve · 20 veinte · 21 veintiuno · 30 treinta · 31 treinta y uno.",
        exercises: [
          translation("I have two brothers", "Tengo dos hermanos", ["tengo 2 hermanos"]),
          fillBlank("Tres + cuatro = ___", "the total", "siete"),
          wordOrder(["Tengo", "veinte", "años"], "Tengo veinte años"),
        ],
      },
      {
        title: "Days and Months",
        objective: "Say the days of the week and months of the year.",
        notes:
          "Days (not capitalised): lunes, martes, miércoles, jueves, viernes, sábado, domingo. Months: enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre. El lunes = on Monday; los lunes = on Mondays.",
        exercises: [
          translation("Today is Monday", "Hoy es lunes"),
          fillBlank("Mi cumpleaños es en ___.", "the month of May", "mayo"),
          wordOrder(["Los", "lunes", "trabajo"], "Los lunes trabajo"),
        ],
      },
      {
        title: "Telling Time",
        objective: "Tell the time and talk about your schedule.",
        notes:
          "¿Qué hora es? Es la una (one o'clock — singular). Son las dos/tres… y cuarto (quarter past) · y media (half past) · menos cuarto (quarter to). De la mañana/de la tarde/de la noche specify the part of day.",
        exercises: [
          translation("It is three o'clock", "Son las tres", ["son las 3"]),
          fillBlank("8:15 = Son las ocho y ___.", "quarter past", "cuarto"),
          wordOrder(["Es", "la", "una", "y", "media"], "Es la una y media"),
        ],
      },
    ],
  },
  {
    title: "People",
    description: "Family and describing people",
    lessons: [
      {
        title: "Family",
        objective: "Name family members and talk about your family.",
        notes:
          "la madre/mamá · el padre/papá · los padres · el hermano/la hermana (brother/sister) · el hijo/la hija (son/daughter) · el abuelo/la abuela (grandfather/grandmother) · el tío/la tía (uncle/aunt). Possessives: mi hermano, tus padres.",
        exercises: [
          translation("This is my sister", "Esta es mi hermana"),
          fillBlank("El padre de mi padre es mi ___.", "grandfather", "abuelo"),
          wordOrder(
            ["Mi", "hermano", "se", "llama", "Pablo"],
            "Mi hermano se llama Pablo"
          ),
        ],
      },
      {
        title: "Describing People",
        objective: "Describe people with common adjectives.",
        notes:
          "alto/alta tall · bajo/baja short · joven young · mayor old · guapo/guapa good-looking · simpático/simpática nice. Adjectives match gender (-o/-a) and number: mis amigos simpáticos.",
        exercises: [
          translation("She is tall and nice", "Ella es alta y simpática", [
            "ella es alta y simpatica",
          ]),
          fillBlank("Mis abuelos son ___.", "old (plural)", "mayores", ["viejos"]),
          wordOrder(["Mi", "padre", "es", "muy", "alto"], "Mi padre es muy alto"),
        ],
      },
      {
        title: "Belongings",
        objective: "Talk about possessions using possessives.",
        notes:
          "mi/mis my · tu/tus your · su/sus his, her, your (formal), their. Nuestro/nuestra our agrees in gender: nuestra casa. Es mi libro = it's my book.",
        exercises: [
          translation("This is my book", "Este es mi libro"),
          fillBlank("¿Son ___ las llaves?", "your (informal, plural)", "tus"),
          wordOrder(
            ["Nuestra", "casa", "es", "pequeña"],
            "Nuestra casa es pequeña"
          ),
        ],
      },
    ],
  },
  {
    title: "Everyday Life",
    description: "Daily routines, food and drinks",
    lessons: [
      {
        title: "Daily Routine",
        objective: "Describe your daily routine with common reflexive verbs.",
        notes:
          "me despierto I wake up · me levanto I get up · me ducho I shower · me acuesto I go to bed. The reflexive pronoun goes before the verb: Se levanta a las siete (he/she gets up at seven).",
        exercises: [
          translation("I get up at seven", "Me levanto a las siete", [
            "me levanto a las 7",
          ]),
          fillBlank("Primero ___ despierto, luego me ducho.", "reflexive pronoun", "me"),
          wordOrder(
            ["Me", "acuesto", "a", "las", "once"],
            "Me acuesto a las once"
          ),
        ],
      },
      {
        title: "Food and Drinks",
        objective: "Talk about food and drinks you like.",
        notes:
          "el agua water · el pan bread · la leche milk · el queso cheese · la fruta fruit · la carne meat · las verduras vegetables. Me gusta + singular; me gustan + plural: Me gusta el pan; Me gustan las manzanas.",
        exercises: [
          translation("I like cheese", "Me gusta el queso"),
          fillBlank("Me ___ las verduras.", "gustar with plural", "gustan"),
          wordOrder(
            ["Para", "el", "desayuno", "como", "pan"],
            "Para el desayuno como pan"
          ),
        ],
      },
      {
        title: "At the Café",
        objective: "Order food and drinks politely.",
        notes:
          "Quiero … I want · quisiera … I would like (polite) · La cuenta, por favor = the bill, please · ¿Algo más? Anything else? · Un café con leche = coffee with milk.",
        exercises: [
          translation("A coffee with milk, please", "Un café con leche, por favor", [
            "un cafe con leche por favor",
          ]),
          fillBlank("___ la cuenta, por favor.", "polite 'I would like'", "Quisiera"),
          wordOrder(
            ["Quiero", "un", "té", "por", "favor"],
            "Quiero un té por favor"
          ),
        ],
      },
    ],
  },
  {
    title: "Out and About",
    description: "Places in town, directions, shopping",
    lessons: [
      {
        title: "Places in Town",
        objective: "Name common places in a town.",
        notes:
          "el banco bank · la biblioteca library · la calle street · la escuela school · el hospital hospital · el mercado market · el museo museum · la plaza square · el supermercado supermarket. Voy al banco (to the bank); voy a la plaza.",
        exercises: [
          translation("The museum is in the square", "El museo está en la plaza"),
          fillBlank("Voy ___ supermercado.", "to the (masculine)", "al"),
          wordOrder(
            ["La", "biblioteca", "está", "cerca"],
            "La biblioteca está cerca"
          ),
        ],
      },
      {
        title: "Directions",
        objective: "Understand and give simple directions.",
        notes:
          "a la derecha to the right · a la izquierda to the left · todo recto straight ahead · cerca near · lejos far. ¿Dónde está …? = Where is …?",
        exercises: [
          translation("Turn right, please", "Gire a la derecha, por favor", [
            "gira a la derecha por favor",
          ]),
          fillBlank("Siga todo ___.", "straight ahead", "recto"),
          wordOrder(["Está", "lejos", "de", "aquí"], "Está lejos de aquí"),
        ],
      },
      {
        title: "Shopping",
        objective: "Buy things and ask about prices.",
        notes:
          "¿Cuánto cuesta? How much is it? Quiero comprar … I want to buy …. Bigger numbers: cuarenta 40 · cincuenta 50 · sesenta 60 · setenta 70 · ochenta 80 · noventa 90 · cien 100.",
        exercises: [
          translation("How much does it cost?", "¿Cuánto cuesta?", ["Cuanto cuesta"]),
          fillBlank("50 euros = ___ euros.", "the number", "cincuenta"),
          wordOrder(
            ["Quiero", "comprar", "dos", "billetes"],
            "Quiero comprar dos billetes"
          ),
        ],
      },
    ],
  },
  {
    title: "Free Time",
    description: "Hobbies, weather, weekend plans",
    lessons: [
      {
        title: "Hobbies",
        objective: "Talk about hobbies and what you like doing.",
        notes:
          "jugar al fútbol to play football · leer to read · escuchar música to listen to music · bailar to dance · nadar to swim. Me gusta + infinitive: Me gusta leer.",
        exercises: [
          translation("I like listening to music", "Me gusta escuchar música", [
            "me gusta escuchar musica",
          ]),
          fillBlank("¿Te gusta ___ al fútbol?", "to play", "jugar"),
          wordOrder(
            ["Me", "gusta", "nadar", "en", "verano"],
            "Me gusta nadar en verano"
          ),
        ],
      },
      {
        title: "Weather and Seasons",
        objective: "Describe the weather and the seasons.",
        notes:
          "Hace sol/calor/frío/fresco/viento. Está nublado it's cloudy · llueve it rains · nieva it snows. Seasons: la primavera spring · el verano summer · el otoño autumn · el invierno winter.",
        exercises: [
          translation("It is cold in winter", "Hace frío en invierno", [
            "hace frio en invierno",
            "hace frío en el invierno",
            "hace frio en el invierno",
          ]),
          fillBlank("Hoy ___ sol.", "it is (weather with hacer)", "hace"),
          wordOrder(["En", "verano", "hace", "calor"], "En verano hace calor"),
        ],
      },
      {
        title: "Weekend Plans",
        objective: "Say what you are going to do using ir a + infinitive.",
        notes:
          "Voy a + infinitive = I am going to …: Voy a estudiar. Vas/Va/Vamos a … for you/he/she/we. El fin de semana = at the weekend.",
        exercises: [
          translation("I am going to study on Saturday", "Voy a estudiar el sábado", [
            "voy a estudiar el sabado",
          ]),
          fillBlank("Vamos a ___ una película.", "to watch (ver)", "ver"),
          wordOrder(
            ["El", "domingo", "voy", "a", "descansar"],
            "El domingo voy a descansar"
          ),
        ],
      },
    ],
  },
];

type CardSeed = {
  target: string;
  translation: string;
  pronunciation: string;
  pos: string;
  example: string;
  exampleTranslation: string;
  difficulty: number;
};

const card = (
  target: string,
  translation: string,
  pronunciation: string,
  pos: string,
  example: string,
  exampleTranslation: string,
  difficulty = 1,
): CardSeed => ({ target, translation, pronunciation, pos, example, exampleTranslation, difficulty });

const CARDS: Record<string, CardSeed[]> = {
  Greetings: [
    card("hola", "hello", "OH-lah", "interjection", "Hola, me llamo Carlos.", "Hello, my name is Carlos."),
    card("buenos días", "good morning", "BWEH-nohs DEE-ahs", "phrase", "Buenos días, señora García.", "Good morning, Mrs. García."),
    card("buenas tardes", "good afternoon", "BWEH-nahs TAR-dehs", "phrase", "Buenas tardes, ¿qué tal?", "Good afternoon, how are you?"),
    card("buenas noches", "good night", "BWEH-nahs NOH-chehs", "phrase", "Buenas noches, hasta mañana.", "Good night, see you tomorrow."),
    card("adiós", "goodbye", "ah-DYOHS", "interjection", "Adiós, nos vemos pronto.", "Goodbye, see you soon."),
    card("hasta luego", "see you later", "AHS-tah LWEH-goh", "phrase", "Hasta luego, amigos.", "See you later, friends.", 2),
    card("¿cómo estás?", "how are you?", "KOH-moh ehs-TAHS", "phrase", "Hola Ana, ¿cómo estás?", "Hi Ana, how are you?", 2),
    card("mucho gusto", "nice to meet you", "MOO-choh GOOS-toh", "phrase", "Mucho gusto, señor López.", "Nice to meet you, Mr. López.", 2),
  ],
  "Introducing Yourself": [
    card("me llamo", "my name is", "meh YAH-moh", "phrase", "Me llamo María Pérez.", "My name is María Pérez."),
    card("soy", "I am", "soee", "verb", "Soy estudiante.", "I am a student."),
    card("¿cómo te llamas?", "what is your name?", "KOH-moh teh YAH-mahs", "phrase", "Hola, ¿cómo te llamas?", "Hi, what's your name?"),
    card("soy de", "I am from", "soee deh", "phrase", "Soy de México.", "I am from Mexico."),
    card("¿y tú?", "and you?", "ee too", "phrase", "Yo bien, ¿y tú?", "I'm fine, and you?", 2),
    card("encantado", "delighted (to meet you)", "ehn-kahn-TAH-doh", "adjective", "Encantado, soy Diego.", "Delighted to meet you, I'm Diego.", 2),
    card("mi nombre es", "my name is (formal)", "mee NOHM-breh ehs", "phrase", "Mi nombre es Elena Ruiz.", "My name is Elena Ruiz.", 2),
    card("un placer", "a pleasure", "oon plah-SEHR", "phrase", "Un placer conocerle.", "A pleasure to meet you.", 3),
  ],
  "Basic Questions": [
    card("¿qué?", "what?", "keh", "question word", "¿Qué comes?", "What are you eating?"),
    card("¿dónde?", "where?", "DOHN-deh", "question word", "¿Dónde vives?", "Where do you live?"),
    card("¿cómo?", "how?", "KOH-moh", "question word", "¿Cómo se dice…?", "How do you say…?"),
    card("¿cuánto?", "how much?", "KWAHN-toh", "question word", "¿Cuánto cuesta?", "How much does it cost?", 2),
    card("¿quién?", "who?", "kee-EHN", "question word", "¿Quién es él?", "Who is he?", 2),
    card("¿de dónde eres?", "where are you from?", "deh DOHN-deh EH-rehs", "phrase", "¿De dónde eres, Juan?", "Where are you from, Juan?", 2),
    card("¿dónde está…?", "where is…?", "DOHN-deh ehs-TAH", "phrase", "¿Dónde está el baño?", "Where is the bathroom?", 2),
    card("¿qué significa…?", "what does … mean?", "keh seeg-nee-FEE-kah", "phrase", "¿Qué significa «mesa»?", "What does «mesa» mean?", 3),
  ],
  "Numbers 0–31": [
    card("uno", "one", "OO-noh", "number", "Solo queda uno.", "Only one is left."),
    card("dos", "two", "dohs", "number", "Quiero dos cafés.", "I want two coffees."),
    card("tres", "three", "trehs", "number", "Son las tres.", "It is three o'clock."),
    card("cuatro", "four", "KWAH-troh", "number", "Hay cuatro sillas.", "There are four chairs."),
    card("cinco", "five", "SEEN-koh", "number", "Tengo cinco primos.", "I have five cousins."),
    card("diez", "ten", "dyes", "number", "Tengo diez euros.", "I have ten euros."),
    card("veinte", "twenty", "BEYN-teh", "number", "El libro cuesta veinte euros.", "The book costs twenty euros.", 2),
    card("quince", "fifteen", "KEEN-seh", "number", "Tengo quince libros.", "I have fifteen books.", 2),
  ],
  "Days and Months": [
    card("lunes", "Monday", "LOO-nehs", "noun", "El lunes tengo clase.", "On Monday I have class."),
    card("martes", "Tuesday", "MAR-tehs", "noun", "Nos vemos el martes.", "See you on Tuesday."),
    card("miércoles", "Wednesday", "MYEHR-koh-lehs", "noun", "El miércoles trabajo hasta las cinco.", "On Wednesday I work until five."),
    card("sábado", "Saturday", "SAH-bah-doh", "noun", "El sábado juego al fútbol.", "On Saturday I play football."),
    card("domingo", "Sunday", "doh-MEEN-goh", "noun", "Los domingos descanso.", "On Sundays I rest.", 2),
    card("enero", "January", "eh-NEH-roh", "noun", "Mi cumpleaños es en enero.", "My birthday is in January.", 2),
    card("julio", "July", "HOO-lee-oh", "noun", "En julio hace calor.", "In July it is hot.", 2),
    card("diciembre", "December", "dee-SYEHM-breh", "noun", "La Navidad es en diciembre.", "Christmas is in December.", 2),
  ],
  "Telling Time": [
    card("la hora", "the hour", "OH-rah", "noun", "Es la hora de comer.", "It is time to eat."),
    card("¿qué hora es?", "what time is it?", "keh OH-rah ehs", "phrase", "Perdone, ¿qué hora es?", "Excuse me, what time is it?"),
    card("y media", "half past", "ee MEH-dyah", "phrase", "Son las dos y media.", "It is half past two."),
    card("y cuarto", "quarter past", "ee KWAHR-toh", "phrase", "Son las cuatro y cuarto.", "It is quarter past four.", 2),
    card("menos cuarto", "quarter to", "MEH-nohs KWAHR-toh", "phrase", "Son las cinco menos cuarto.", "It is quarter to five.", 2),
    card("de la mañana", "in the morning (a.m.)", "deh lah mah-NYAH-nah", "phrase", "Trabajo de nueve de la mañana a cinco.", "I work from nine in the morning to five.", 2),
    card("de la noche", "at night (p.m.)", "deh lah NOH-cheh", "phrase", "Ceno a las ocho de la noche.", "I have dinner at eight in the evening.", 2),
    card("el mediodía", "midday", "meh-dyoh-DEE-ah", "noun", "Como al mediodía.", "I eat at midday.", 3),
  ],
  Family: [
    card("la madre", "the mother", "MAH-dreh", "noun", "Mi madre es profesora.", "My mother is a teacher."),
    card("el padre", "the father", "PAH-dreh", "noun", "Mi padre trabaja en Madrid.", "My father works in Madrid."),
    card("los padres", "the parents", "PAH-drehs", "noun", "Mis padres viven en Sevilla.", "My parents live in Seville."),
    card("el hermano", "the brother", "ehr-MAH-noh", "noun", "Mi hermano tiene diez años.", "My brother is ten years old."),
    card("la hermana", "the sister", "ehr-MAH-nah", "noun", "Mi hermana se llama Lucía.", "My sister is called Lucía."),
    card("el abuelo", "the grandfather", "ah-BWEH-loh", "noun", "Mi abuelo tiene ochenta años.", "My grandfather is eighty years old.", 2),
    card("la hija", "the daughter", "EE-hah", "noun", "Su hija tiene tres años.", "Their daughter is three years old.", 2),
    card("el tío", "the uncle", "TEE-oh", "noun", "Mi tío vive en Valencia.", "My uncle lives in Valencia.", 2),
  ],
  "Describing People": [
    card("alto", "tall", "AHL-toh", "adjective", "Mi hermano es muy alto.", "My brother is very tall."),
    card("bajo", "short (in height)", "BAH-hoh", "adjective", "Soy bajo pero rápido.", "I am short but fast."),
    card("joven", "young", "HOH-behn", "adjective", "Mi profesora es joven.", "My teacher is young."),
    card("mayor", "old", "mah-YOHR", "adjective", "Mi abuela ya es mayor.", "My grandmother is already old."),
    card("guapo", "good-looking", "GWAH-poh", "adjective", "Tu primo es muy guapo.", "Your cousin is very good-looking.", 2),
    card("simpático", "nice, friendly", "seem-PAH-tee-koh", "adjective", "Mis vecinos son simpáticos.", "My neighbours are nice.", 2),
    card("delgado", "slim", "dehl-GAH-doh", "adjective", "Mi gato es delgado.", "My cat is slim.", 2),
    card("rubio", "blond", "ROO-byoh", "adjective", "Mi amiga es rubia.", "My friend is blond.", 3),
  ],
  Belongings: [
    card("mi", "my", "mee", "possessive", "Mi casa es pequeña.", "My house is small."),
    card("tu", "your", "too", "possessive", "¿Cómo se llama tu perro?", "What is your dog called?"),
    card("su", "his, her, your (formal)", "soo", "possessive", "Su coche es nuevo.", "His car is new.", 2),
    card("nuestro", "our", "NWEHS-troh", "possessive", "Nuestro profesor es de Perú.", "Our teacher is from Peru.", 2),
    card("el libro", "the book", "LEE-broh", "noun", "Este libro es interesante.", "This book is interesting."),
    card("la llave", "the key", "YAH-beh", "noun", "La llave está en la mesa.", "The key is on the table.", 2),
    card("el teléfono", "the phone", "teh-LEH-foh-noh", "noun", "Mi teléfono es nuevo.", "My phone is new."),
    card("la mochila", "the backpack", "moh-CHEE-lah", "noun", "Mi mochila es azul.", "My backpack is blue.", 2),
  ],
  "Daily Routine": [
    card("me despierto", "I wake up", "meh dehs-PYEHR-toh", "reflexive verb", "Me despierto a las seis.", "I wake up at six."),
    card("me levanto", "I get up", "meh leh-BAHN-toh", "reflexive verb", "Me levanto temprano.", "I get up early."),
    card("me ducho", "I shower", "meh DOO-choh", "reflexive verb", "Me ducho por la mañana.", "I shower in the morning."),
    card("desayuno", "I have breakfast", "deh-sah-YOO-noh", "verb", "Desayuno café y pan.", "I have coffee and bread for breakfast."),
    card("trabajo", "I work", "trah-BAH-hoh", "verb", "Trabajo en una oficina.", "I work in an office."),
    card("ceno", "I have dinner", "SEH-noh", "verb", "Ceno a las nueve.", "I have dinner at nine.", 2),
    card("me acuesto", "I go to bed", "meh ah-KWEHS-toh", "reflexive verb", "Me acuesto a las once.", "I go to bed at eleven.", 2),
    card("duermo", "I sleep", "DWEHR-moh", "verb", "Duermo ocho horas.", "I sleep eight hours.", 2),
  ],
  "Food and Drinks": [
    card("el agua", "water", "AH-gwah", "noun", "Bebo agua con la comida.", "I drink water with my meal."),
    card("el pan", "bread", "pahn", "noun", "Compro pan cada mañana.", "I buy bread every morning."),
    card("la leche", "milk", "LEH-cheh", "noun", "Tomo leche con el café.", "I have milk with my coffee."),
    card("el queso", "cheese", "KEH-soh", "noun", "Me gusta el queso.", "I like cheese."),
    card("la manzana", "apple", "mahn-SAH-nah", "noun", "Como una manzana al día.", "I eat an apple a day."),
    card("la carne", "meat", "KAR-neh", "noun", "No como carne.", "I don't eat meat.", 2),
    card("las verduras", "vegetables", "behr-DOO-rahs", "noun", "Me gustan las verduras.", "I like vegetables.", 2),
    card("el café", "coffee", "kah-FEH", "noun", "Un café, por favor.", "A coffee, please."),
  ],
  "At the Café": [
    card("quisiera", "I would like", "kee-SYEH-rah", "verb (polite)", "Quisiera un café solo.", "I would like an espresso.", 2),
    card("la cuenta", "the bill", "KWEHN-tah", "noun", "La cuenta, por favor.", "The bill, please."),
    card("el menú", "the menu", "meh-NOO", "noun", "¿Puedo ver el menú?", "Can I see the menu?"),
    card("para llevar", "to take away", "PAH-rah yeh-BAHR", "phrase", "Dos cafés para llevar.", "Two coffees to take away.", 2),
    card("¿algo más?", "anything else?", "AHL-goh mahs", "phrase", "¿Algo más, señor?", "Anything else, sir?"),
    card("la mesa", "the table", "MEH-sah", "noun", "Una mesa para dos, por favor.", "A table for two, please."),
    card("el camarero", "the waiter", "kah-mah-REH-roh", "noun", "El camarero es muy amable.", "The waiter is very kind.", 2),
    card("el desayuno", "breakfast", "deh-sah-YOO-noh", "noun", "El desayuno es a las siete.", "Breakfast is at seven."),
  ],
  "Places in Town": [
    card("el banco", "the bank", "BAHN-koh", "noun", "El banco cierra a las tres.", "The bank closes at three."),
    card("la biblioteca", "the library", "bee-blee-oh-TEH-kah", "noun", "Estudio en la biblioteca.", "I study in the library."),
    card("la escuela", "the school", "ehs-KWEH-lah", "noun", "Mi hijo va a la escuela.", "My son goes to school."),
    card("el hospital", "the hospital", "ohs-pee-TAHL", "noun", "El hospital está cerca.", "The hospital is nearby."),
    card("el mercado", "the market", "mehr-KAH-doh", "noun", "Compro fruta en el mercado.", "I buy fruit at the market.", 2),
    card("el museo", "the museum", "moo-SEH-oh", "noun", "El museo abre a las diez.", "The museum opens at ten.", 2),
    card("la plaza", "the square", "PLAH-sah", "noun", "Nos vemos en la plaza.", "See you in the square."),
    card("el supermercado", "the supermarket", "soo-pehr-mehr-KAH-doh", "noun", "Hay un supermercado aquí al lado.", "There is a supermarket next door.", 2),
  ],
  Directions: [
    card("a la derecha", "to the right", "ah lah deh-REH-chah", "phrase", "El banco está a la derecha.", "The bank is on the right."),
    card("a la izquierda", "to the left", "ah lah ees-KYEHR-dah", "phrase", "Gira a la izquierda.", "Turn left."),
    card("todo recto", "straight ahead", "TOH-doh REHK-toh", "phrase", "Siga todo recto.", "Go straight ahead."),
    card("cerca", "near", "SEHR-kah", "adverb", "Vivo cerca del parque.", "I live near the park."),
    card("lejos", "far", "LEH-hohs", "adverb", "La estación queda lejos.", "The station is far away."),
    card("la esquina", "the corner", "ehs-KEE-nah", "noun", "El café está en la esquina.", "The café is on the corner.", 2),
    card("el semáforo", "the traffic light", "seh-MAH-foh-roh", "noun", "Gire en el semáforo.", "Turn at the traffic light.", 2),
    card("girar", "to turn", "hee-RAHR", "verb", "¿Puedo girar aquí?", "Can I turn here?", 2),
  ],
  Shopping: [
    card("comprar", "to buy", "kohm-PRAHR", "verb", "Quiero comprar pan.", "I want to buy bread."),
    card("¿cuánto cuesta?", "how much does it cost?", "KWAHN-toh KWEHS-tah", "phrase", "¿Cuánto cuesta este sombrero?", "How much does this hat cost?"),
    card("caro", "expensive", "KAH-roh", "adjective", "Este coche es muy caro.", "This car is very expensive."),
    card("barato", "cheap", "bah-RAH-toh", "adjective", "Estos libros son baratos.", "These books are cheap."),
    card("la tienda", "the shop", "TYEHN-dah", "noun", "La tienda abre a las nueve.", "The shop opens at nine."),
    card("el dinero", "money", "dee-NEH-roh", "noun", "No tengo dinero suficiente.", "I don't have enough money.", 2),
    card("la ropa", "clothes", "RROH-pah", "noun", "Compro ropa en línea.", "I buy clothes online.", 2),
    card("gratis", "free", "GRAH-tees", "adjective", "La entrada es gratis.", "Admission is free.", 2),
  ],
  Hobbies: [
    card("jugar", "to play", "hoo-GAHR", "verb", "Juego al tenis los sábados.", "I play tennis on Saturdays."),
    card("leer", "to read", "leh-EHR", "verb", "Me gusta leer novelas.", "I like reading novels."),
    card("escuchar música", "to listen to music", "ehs-KOO-char MOO-see-kah", "phrase", "Escucho música por la tarde.", "I listen to music in the afternoon."),
    card("bailar", "to dance", "bai-LAHR", "verb", "Bailo salsa los viernes.", "I dance salsa on Fridays."),
    card("nadar", "to swim", "nah-DAHR", "verb", "Nado en la piscina.", "I swim in the pool."),
    card("correr", "to run", "koh-RREHR", "verb", "Corro en el parque.", "I run in the park.", 2),
    card("cocinar", "to cook", "koh-see-NAHR", "verb", "Cocino con mi padre.", "I cook with my father.", 2),
    card("pintar", "to paint", "peen-TAHR", "verb", "Pinto paisajes.", "I paint landscapes.", 3),
  ],
  "Weather and Seasons": [
    card("hace sol", "it is sunny", "AH-seh sohl", "phrase", "Hoy hace sol en Sevilla.", "It is sunny today in Seville."),
    card("hace calor", "it is hot", "AH-seh kah-LOHR", "phrase", "En agosto hace mucho calor.", "In August it is very hot."),
    card("hace frío", "it is cold", "AH-seh FREE-oh", "phrase", "En invierno hace frío.", "In winter it is cold."),
    card("llueve", "it rains", "YEH-beh", "verb", "Llueve mucho en Bilbao.", "It rains a lot in Bilbao.", 2),
    card("nieva", "it snows", "NYEH-bah", "verb", "En la montaña nieva.", "In the mountains it snows.", 2),
    card("la primavera", "spring", "pree-mah-BEH-rah", "noun", "Me gusta la primavera.", "I like spring."),
    card("el verano", "summer", "beh-RAH-noh", "noun", "Voy a la playa en verano.", "I go to the beach in summer."),
    card("el invierno", "winter", "een-BYEHR-noh", "noun", "El invierno es frío aquí.", "Winter is cold here.", 2),
  ],
  "Weekend Plans": [
    card("ir a", "going to", "eer ah", "phrase", "Voy a estudiar mañana.", "I am going to study tomorrow.", 2),
    card("el fin de semana", "the weekend", "feen deh seh-MAH-nah", "noun", "El fin de semana viajo a Toledo.", "At the weekend I travel to Toledo."),
    card("salir", "to go out", "sah-LEER", "verb", "Salgo con mis amigos.", "I go out with my friends."),
    card("quedar con", "to meet up with", "keh-DAHR kohn", "phrase", "Quedo con Ana el sábado.", "I am meeting Ana on Saturday.", 2),
    card("descansar", "to rest", "dehs-KAHN-sahr", "verb", "El domingo descanso.", "On Sunday I rest."),
    card("viajar", "to travel", "byah-HAHR", "verb", "Queremos viajar a México.", "We want to travel to Mexico.", 2),
    card("el plan", "the plan", "plahn", "noun", "¿Cuál es el plan para hoy?", "What is the plan for today?"),
    card("la película", "the film", "peh-LEE-koo-lah", "noun", "Vamos a ver una película.", "We are going to watch a film.", 2),
  ],
};

async function main() {
  for (const lang of LANGUAGES) {
    await db.language.upsert({
      where: { code: lang.code },
      update: { name: lang.name, nativeName: lang.nativeName, isActive: true },
      create: { ...lang, isActive: true },
    });
  }

  for (const level of LEVELS) {
    await db.level.upsert({
      where: { code: level.code },
      update: { name: level.name, order: level.order },
      create: level,
    });
  }

  const spanish = await db.language.findUniqueOrThrow({ where: { code: "es" } });
  const a1 = await db.level.findUniqueOrThrow({ where: { code: "A1" } });

  const course = await db.course.upsert({
    where: { languageId_levelId: { languageId: spanish.id, levelId: a1.id } },
    update: { title: "Spanish A1", status: "PUBLISHED" },
    create: {
      languageId: spanish.id,
      levelId: a1.id,
      title: "Spanish A1",
      description:
        "Beginner Spanish: structured lessons from first words to simple conversations.",
      status: "PUBLISHED",
    },
  });

  let lessonCount = 0;
  let exerciseCount = 0;
  let cardCount = 0;

  const slug = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  for (const [mIndex, mod] of MODULES.entries()) {
    const moduleOrder = mIndex + 1;
    const module_ = await db.module.upsert({
      where: { courseId_order: { courseId: course.id, order: moduleOrder } },
      update: { title: mod.title, description: mod.description },
      create: {
        courseId: course.id,
        order: moduleOrder,
        title: mod.title,
        description: mod.description,
      },
    });

    for (const [lIndex, lesson] of mod.lessons.entries()) {
      const lessonOrder = lIndex + 1;
      const lessonRow = await db.lesson.upsert({
        where: { moduleId_order: { moduleId: module_.id, order: lessonOrder } },
        update: {
          title: lesson.title,
          objective: lesson.objective,
          notes: lesson.notes,
          status: "PUBLISHED",
        },
        create: {
          moduleId: module_.id,
          order: lessonOrder,
          title: lesson.title,
          objective: lesson.objective,
          notes: lesson.notes,
          status: "PUBLISHED",
        },
      });
      lessonCount += 1;

      for (const [eIndex, exercise] of lesson.exercises.entries()) {
        const exerciseOrder = eIndex + 1;
        await db.exercise.upsert({
          where: { lessonId_order: { lessonId: lessonRow.id, order: exerciseOrder } },
          update: {
            type: exercise.type,
            prompt: exercise.prompt,
            content: exercise.content,
            answer: exercise.answer,
            status: "PUBLISHED",
          },
          create: {
            lessonId: lessonRow.id,
            order: exerciseOrder,
            type: exercise.type,
            prompt: exercise.prompt,
            content: exercise.content,
            answer: exercise.answer,
            status: "PUBLISHED",
          },
        });
        exerciseCount += 1;
      }

      const cards = CARDS[lesson.title] ?? [];
    for (const [cIndex, c] of cards.entries()) {
      const cardOrder = cIndex + 1;
      const audioUrl = `/audio/es/${slug(mod.title)}-l${lessonOrder}-${cardOrder}.mp3`;
      await db.flashcard.upsert({
        where: { lessonId_order: { lessonId: lessonRow.id, order: cardOrder } },
        update: {
          targetText: c.target,
          translation: c.translation,
          pronunciation: c.pronunciation,
          exampleSentence: c.example,
          exampleTranslation: c.exampleTranslation,
          partOfSpeech: c.pos,
          audioUrl,
          difficulty: c.difficulty,
          topic: lesson.title,
          status: "PUBLISHED",
        },
        create: {
          lessonId: lessonRow.id,
          order: cardOrder,
          targetText: c.target,
          translation: c.translation,
          pronunciation: c.pronunciation,
          exampleSentence: c.example,
          exampleTranslation: c.exampleTranslation,
          partOfSpeech: c.pos,
          audioUrl,
          difficulty: c.difficulty,
          topic: lesson.title,
          status: "PUBLISHED",
        },
      });
      cardCount += 1;
    }
    }
  }

  const counts = {
    languages: await db.language.count(),
    levels: await db.level.count(),
    courses: await db.course.count(),
    modules: await db.module.count(),
    lessons: await db.lesson.count(),
    exercises: await db.exercise.count(),
  };
  console.log(
    `SEED OK: authored ${lessonCount} lessons / ${exerciseCount} exercises / ${cardCount} flashcards this run`,
  );
  console.log("TOTALS:", JSON.stringify(counts));
}

main()
  .catch((e) => {
    console.error("SEED FAILED:", e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
