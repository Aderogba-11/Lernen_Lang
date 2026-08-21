export type ListeningQuestion = {
  prompt: string;
  options: string[];
  answerIndex: number;
};

export type ListeningItem = {
  slug: string;
  moduleTitle: string;
  script: string;
  questions: ListeningQuestion[];
};

export const LISTENINGS: ListeningItem[] = [
  {
    slug: "foundations",
    moduleTitle: "Foundations",
    script:
      "Hola. Me llamo Carmen. Soy de España, de Madrid. Mi hermano se llama Pablo. Él es alto y simpático.",
    questions: [
      {
        prompt: "¿Cómo se llama la mujer?",
        options: ["Carmen", "Ana", "Elena", "María"],
        answerIndex: 0,
      },
      {
        prompt: "¿De dónde es?",
        options: ["De México", "De España", "De Perú", "De Cuba"],
        answerIndex: 1,
      },
      {
        prompt: "¿Cómo es Pablo?",
        options: ["Bajo y serio", "Alto y simpático", "Joven y rubio", "Delgado y alto"],
        answerIndex: 1,
      },
    ],
  },
  {
    slug: "numbers-and-time",
    moduleTitle: "Numbers and Time",
    script:
      "Buenos días. Es lunes y son las ocho y cuarto de la mañana. Mi clase empieza a las nueve. El sábado es mi cumpleaños. Voy a tener veinte años.",
    questions: [
      {
        prompt: "¿Qué día es hoy?",
        options: ["Martes", "Lunes", "Sábado", "Domingo"],
        answerIndex: 1,
      },
      {
        prompt: "¿Qué hora es?",
        options: ["Las ocho y media", "Las nueve y cuarto", "Las ocho y cuarto", "Las siete y media"],
        answerIndex: 2,
      },
      {
        prompt: "¿Cuántos años va a tener?",
        options: ["Dieciocho", "Diecinueve", "Treinta", "Veinte"],
        answerIndex: 3,
      },
    ],
  },
  {
    slug: "people",
    moduleTitle: "People",
    script:
      "Mi familia vive en Sevilla. Mi padre es profesor y mi madre es enfermera. Tengo dos hermanas. Mi abuela tiene setenta y cinco años y es muy simpática.",
    questions: [
      {
        prompt: "¿Dónde vive la familia?",
        options: ["En Madrid", "En Barcelona", "En Sevilla", "En Valencia"],
        answerIndex: 2,
      },
      {
        prompt: "¿Cuántas hermanas tiene?",
        options: ["Una", "Dos", "Tres", "Ninguna"],
        answerIndex: 1,
      },
      {
        prompt: "¿Cuántos años tiene la abuela?",
        options: ["Sesenta y cinco", "Setenta", "Setenta y cinco", "Ochenta"],
        answerIndex: 2,
      },
    ],
  },
  {
    slug: "everyday-life",
    moduleTitle: "Everyday Life",
    script:
      "Todos los días me levanto a las siete y me ducho. Desayuno café con leche y pan. Como al mediodía en una cafetería cerca del trabajo. Ceno a las nueve de la noche.",
    questions: [
      {
        prompt: "¿A qué hora se levanta?",
        options: ["A las seis", "A las siete", "A las ocho", "A las nueve"],
        answerIndex: 1,
      },
      {
        prompt: "¿Qué desayuna?",
        options: ["Té y tostadas", "Café con leche y pan", "Solo café", "Fruta"],
        answerIndex: 1,
      },
      {
        prompt: "¿Dónde come al mediodía?",
        options: ["En casa", "En el trabajo", "En una cafetería", "En un restaurante"],
        answerIndex: 2,
      },
    ],
  },
  {
    slug: "out-and-about",
    moduleTitle: "Out and About",
    script:
      "Perdone, ¿hay un banco cerca? Siga todo recto y gire a la izquierda en el semáforo. El banco está entre una librería y un supermercado, al lado de la plaza.",
    questions: [
      {
        prompt: "¿Qué busca la persona?",
        options: ["Un supermercado", "Un banco", "Una plaza", "Una librería"],
        answerIndex: 1,
      },
      {
        prompt: "¿Adónde debe girar?",
        options: ["A la derecha", "Todo recto", "A la izquierda", "Al final de la calle"],
        answerIndex: 2,
      },
      {
        prompt: "¿Dónde está el banco?",
        options: [
          "Enfrente de la plaza",
          "Entre una librería y un supermercado",
          "Lejos de aquí",
          "En el semáforo",
        ],
        answerIndex: 1,
      },
    ],
  },
  {
    slug: "free-time",
    moduleTitle: "Free Time",
    script:
      "Este fin de semana hace buen tiempo. El sábado voy a jugar al tenis con mi hermano. Por la tarde vamos a nadar en la piscina. Si llueve el domingo, voy a leer en casa.",
    questions: [
      {
        prompt: "¿Qué va a hacer el sábado?",
        options: ["Jugar al tenis", "Ver una película", "Cocinar", "Descansar"],
        answerIndex: 0,
      },
      {
        prompt: "¿Con quién va a jugar?",
        options: ["Con su padre", "Con amigos", "Con su hermano", "Solo"],
        answerIndex: 2,
      },
      {
        prompt: "¿Qué va a hacer si llueve el domingo?",
        options: ["Nadar", "Leer en casa", "Salir", "Escuchar música"],
        answerIndex: 1,
      },
    ],
  },
];
