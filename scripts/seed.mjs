// Seed do curso de demonstração "Inglês A1 Adulto" (Módulo 01, Lições 02–04),
// baseado no material USpeaK / Mr. Dave Idiomas.
//
// Cloud-only: insere direto no projeto via service_role (sem `supabase db reset`).
// Idempotente: apaga o curso de demonstração (por slug) e recria; garante o
// aluno demo e a matrícula. Rode com: pnpm seed
//
// ATENÇÃO: usa a SUPABASE_SERVICE_ROLE_KEY do .env. Nunca rode contra um banco
// de produção real com dados de clientes.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_EMAIL = "aluno@demo.com";
const DEMO_PASSWORD = "demo1234";
const COURSE_SLUG = "ingles-a1-adulto";

// ------------------------------------------------------------------
// Conteúdo (fiel ao material, resumido onde necessário)
// ------------------------------------------------------------------
const rich = (text) => ({ type: "rich_text", data: { text } });
const vocab = (items) => ({ type: "vocabulary", data: { items } });
const reading = (title, text) => ({ type: "reading_tts", data: { title, text } });
const dialogue = (lines) => ({ type: "dialogue_tts", data: { lines } });
const pron = (title, items) => ({ type: "pronunciation", data: { title, items } });
const mc = (question, options, answerIndex) => ({
  type: "multiple_choice",
  data: { question, options },
  solution: { answerIndex },
});
const fill = (prompt, answer, alternatives) => ({
  type: "fill_blank",
  data: { prompt },
  solution: alternatives ? { answer, alternatives } : { answer },
});

const lesson02 = {
  title: "Lesson 02 — Verb to be: First Look",
  parts: [
    {
      title: "Abertura",
      blocks: [
        rich(
          "Na Lição 02, veremos a forma afirmativa do verbo to be no presente. Na gramática, vamos conhecer os pronomes pessoais. O vocabulário traz expressões para se apresentar e perguntar informações sobre outra pessoa, e há um diálogo no final para praticar.\n\nAo final desta aula espera-se que você:\n• Saiba se apresentar e pedir para que outra pessoa se apresente\n• Conheça e saiba utilizar os pronomes pessoais\n• Saiba conjugar o verbo to be no presente afirmativo",
        ),
        reading(
          "My name is John",
          "Hello! My name is John. I am from New York, and I am 25 years old. I am a student, and I am learning English. I like to play soccer, watch movies, and read books. I live in a small apartment with my friend Sarah. She is from London. She is a teacher, and she is very friendly.",
        ),
      ],
    },
    {
      title: "Vocabulary — Personal presentation",
      blocks: [
        vocab([
          { term: "name", translation: "nome", example: "My name is Ana" },
          { term: "from", translation: "de (origem)", example: "I am from Brazil" },
          { term: "student", translation: "estudante, aluno", example: "I am a student at a language school" },
          { term: "learning", translation: "aprendendo", example: "They are learning English online" },
          { term: "like", translation: "gostar, curtir", example: "I like to read books in my free time" },
          { term: "friend", translation: "amigo(a)", example: "My friend is always there for me" },
          { term: "class", translation: "aula, classe", example: "I have an English class tomorrow morning" },
        ]),
        rich(
          "Apresentação pessoal:\n• Hello! (Olá)\n• My name is ... / I am ... (Meu nome é... / Eu me chamo...)\n• I am (xx) years old (Eu tenho [xx] anos)\n• I am a/an ... / I work as ... (Eu sou um/uma... / Eu trabalho de...)\n• I am from (city, state, country) (Eu sou de...)\n• Nice to meet you! (Prazer em te conhecer!)\n\nPerguntando informações pessoais:\n• What's your name? (Qual seu nome?)\n• How old are you? (Quantos anos você tem?)\n• What do you do? (O que você faz da vida?)\n• Where are you from? (De onde você é?)",
        ),
      ],
    },
    {
      title: "Lesson topic — Verb to be (affirmative)",
      blocks: [
        rich(
          "O verbo to be é um dos mais importantes do inglês. Seu uso principal tem o sentido de \"ser/estar\":\n• Identidade: I am a teacher\n• Origem: She is from Brazil\n• Idade: He is 25 years old\n• Sentimentos: They are happy\n\nO verbo to be é irregular — tem uma forma para cada pronome:\n\nI am — eu sou/estou\nYou are — você é/está\nHe is — ele é/está\nShe is — ela é/está\nIt is — ele/ela (neutro) é/está\nWe are — nós somos/estamos\nYou are — vocês são/estão\nThey are — eles/elas são/estão",
        ),
      ],
    },
    {
      title: "Grammar — Personal pronouns",
      blocks: [
        rich(
          "Os pronomes pessoais substituem o sujeito da frase, deixando a comunicação mais rápida e clara. Em vez de \"Sean is my friend. Sean is from Colorado\", dizemos \"He is my friend. He is from Colorado\".\n\nSINGULAR:\n• I (eu) · you (você) · he (ele) · she (ela) · it (ele/ela neutro)\n\nPLURAL:\n• we (nós) · you (vocês) · they (eles/elas)\n\nAtenção: o pronome \"I\" é sempre escrito em letra maiúscula, em qualquer posição da frase.",
        ),
      ],
    },
    {
      title: "Pronunciation — Contracted form",
      blocks: [
        pron("Verb to be: forma contraída", [
          "I am → I'm a student",
          "You are → You're my friend",
          "He is → He's 12 years old",
          "She is → She's a teacher",
          "We are → We're in the same class",
          "They are → They're my classmates",
        ]),
      ],
    },
    {
      title: "Dialogue",
      blocks: [
        dialogue([
          { speaker: "Connor", text: "Hello! I'm Connor. What's your name?" },
          { speaker: "Pedro", text: "My name is Pedro. Nice to meet you." },
          { speaker: "Connor", text: "Nice to meet you too, Pedro. How old are you?" },
          { speaker: "Pedro", text: "I am 35 years old, and you?" },
          { speaker: "Connor", text: "I'm 31. So, where are you from?" },
          { speaker: "Pedro", text: "I'm from Salvador, Bahia. You?" },
          { speaker: "Connor", text: "I'm from Canada, but I'm living in Curitiba now." },
          { speaker: "Pedro", text: "That's cool!" },
        ]),
      ],
    },
    {
      title: "Exercises",
      blocks: [
        mc("Where ___ you from?", ["am", "is", "are"], 2),
        mc("My name ___ Sarah.", ["am", "is", "are"], 1),
        mc("They ___ my classmates.", ["am", "is", "are"], 2),
        fill("Complete com o verbo to be: I ___ a student.", "am"),
        fill("Pronome correto: ___ is a teacher. (Sarah)", "she"),
        fill("Reescreva com contração: I am happy.", "I'm happy", ["im happy"]),
      ],
    },
    {
      title: "Revisão",
      kind: "golden",
      blocks: [
        rich("Revisão da lição — gabarite os exercícios desta parte para ganhar a recompensa extra."),
        mc("She ___ a teacher.", ["am", "is", "are"], 1),
        fill("Reescreva com contração: They are friends.", "They're friends", ["theyre friends"]),
      ],
    },
  ],
};

const lesson03 = {
  title: "Lesson 03 — To be or not to be?",
  parts: [
    {
      title: "Abertura",
      blocks: [
        rich(
          "Na Lição 03, veremos a forma negativa do verbo to be no presente. Na gramática, vamos conhecer os artigos definido e indefinidos. O vocabulário traz cumprimentos e despedidas usados nos EUA e no Reino Unido, e há um diálogo no final para praticar.\n\nAo final desta aula espera-se que você:\n• Saiba usar a forma negativa do verbo to be no presente\n• Saiba diferenciar e usar as contrações da forma negativa\n• Saiba utilizar os artigos definido e indefinidos\n• Saiba cumprimentar e se despedir em inglês",
        ),
        reading(
          "Sundays are for resting",
          "Hi! My name is Sarah and I'm from London. I'm a teacher at a small school. Today is Sunday, so I'm not at work. I'm at home with my friend Mike. He is not a teacher — he is a doctor. We are not busy today. It's a quiet morning. We are in the kitchen. I am not hungry, but Mike is. We are not cooking now, we are just drinking tea and talking. The weather is nice. It is not cold. It is sunny and warm.",
        ),
      ],
    },
    {
      title: "Vocabulary — Greetings and Farewells",
      blocks: [
        vocab([
          { term: "teacher", translation: "professor(a)", example: "She is a teacher at a school" },
          { term: "doctor", translation: "médico(a)", example: "Mike is not a teacher, he is a doctor" },
          { term: "home", translation: "casa, lar", example: "I'm at home today" },
          { term: "busy", translation: "ocupado(a)", example: "We are not busy now" },
          { term: "hungry", translation: "com fome", example: "He is hungry, but I am not" },
          { term: "sunny", translation: "ensolarado", example: "It is sunny today" },
        ]),
        rich(
          "GREETINGS (Cumprimentos):\n• Hello! / Hiya! — Olá!\n• Hi! — Oi!\n• Good morning! / Morning! — Bom dia!\n• Good afternoon! — Boa tarde!\n• Good evening! — Boa noite!\n• How are you? — Como você está?\n\nFAREWELLS (Despedidas):\n• Goodbye / Cheers — Tchau!\n• See you later / Laters — Te vejo mais tarde\n• Take care — Se cuida\n• Have a good day — Tenha um bom dia\n• See you around — Te vejo por aí",
        ),
      ],
    },
    {
      title: "Lesson topic — Verb to be (negative)",
      blocks: [
        rich(
          "A forma negativa do verbo to be no presente é feita com a palavra NOT, vindo após o verbo.\n\nPodemos usar de três maneiras:\n• Forma extensa: He is not hungry\n• Contraída (pronome + to be + not): He's not hungry\n• Contraída (to be + not): He isn't hungry\n\nI am not — I'm not\nYou are not — You're not / You aren't\nHe is not — He's not / He isn't\nShe is not — She's not / She isn't\nIt is not — It's not / It isn't\nWe are not — We're not / We aren't\nThey are not — They're not / They aren't\n\nNa fala, as contrações (isn't, aren't) são muito mais comuns. Na escrita formal, a forma não contraída (is not, are not) aparece mais.",
        ),
      ],
    },
    {
      title: "Grammar — Articles",
      blocks: [
        rich(
          "Artigos em inglês:\n• Indefinidos: A / AN (um/uma)\n• Definido: THE (o/a; os/as)\n\nIndefinite article A/AN — regrinhas:\n• \"a\" antes de palavras com som de consoante: a car, a book\n• \"an\" antes de palavras com som de vogal: an orange, an apple, an egg\n\nDefinite article THE — usamos quando:\n• O objeto já foi mencionado ou é conhecido: The book is on the table\n• Há apenas um do tipo: The sun is strong this morning\n• É algo específico: The teacher is nice\n\nNão usamos \"the\" antes de nome de pessoas: Carlos is looking for you.",
        ),
      ],
    },
    {
      title: "Pronunciation — The 'th' sound",
      blocks: [
        pron("The 'th' sound", [
          "On Thursday morning, Theo thinks about three things.",
          "I think the weather is better than yesterday.",
          "Then, he thanks his brother for the coffee.",
          "This is the best coffee this week!",
        ]),
      ],
    },
    {
      title: "Dialogue",
      blocks: [
        dialogue([
          { speaker: "Emma", text: "Hi!" },
          { speaker: "Mr. Brown", text: "Good morning, Miss. Are you a new student?" },
          { speaker: "Emma", text: "Yes, I am! Are you a student too?" },
          { speaker: "Mr. Brown", text: "No, I'm not a student. I'm a teacher." },
          { speaker: "Emma", text: "Oh, sorry! I'm a student. My name is Emma." },
          { speaker: "Mr. Brown", text: "Nice to meet you, Emma. I'm Mr. Brown." },
          { speaker: "Emma", text: "Is this the English class?" },
          { speaker: "Mr. Brown", text: "No, it isn't. This is the Math class. The English class is in Room 4." },
        ]),
      ],
    },
    {
      title: "Exercises",
      blocks: [
        mc("I have ___ apple in my bag.", ["a", "an", "the"], 1),
        mc("She is ___ teacher.", ["a", "an", "the"], 0),
        mc("___ sun is shining.", ["A", "An", "The"], 2),
        fill("Forma negativa: He ___ my brother.", "is not", ["isn't", "isn’t"]),
        fill("Forma negativa: We ___ late.", "are not", ["aren't", "aren’t"]),
        fill("Cumprimento da manhã (em inglês):", "good morning"),
      ],
    },
    {
      title: "Revisão",
      kind: "golden",
      blocks: [
        rich("Revisão — gabarite os exercícios desta parte da Lição 03."),
        mc("Artigo correto: I want ___ orange.", ["a", "an", "the"], 1),
        fill("Contração de 'They are not here':", "they aren't here", ["they're not here", "they aren’t here"]),
      ],
    },
  ],
};

const lesson04 = {
  title: "Lesson 04 — Are you ok, Annie?",
  parts: [
    {
      title: "Abertura",
      blocks: [
        rich(
          "Na Lição 04, vamos aprender a fazer perguntas com o verbo to be no presente. Na gramática, conheceremos os pronomes demonstrativos (this, that, these, those) e como perguntar \"O que é isso?\". O vocabulário traz formas de perguntar \"Como você está?\" e as respostas mais comuns.\n\nAo final desta aula espera-se que você:\n• Saiba usar o verbo to be na forma interrogativa no presente\n• Saiba responder \"How are you?\" em inglês\n• Saiba utilizar os pronomes demonstrativos this & that",
        ),
        dialogue([
          { speaker: "Peter", text: "Hi, Nigel! How are you?" },
          { speaker: "Nigel", text: "Hi, Peter! I'm good, thanks. How about you?" },
          { speaker: "Peter", text: "I'm fine. Let me introduce you to my young brother, Caleb." },
          { speaker: "Caleb", text: "Nice to meet you, Nigel." },
          { speaker: "Nigel", text: "Nice to meet you too! So, Peter, who is that girl over there?" },
          { speaker: "Peter", text: "That is my cousin, Laura." },
        ]),
      ],
    },
    {
      title: "Vocabulary — How are you?",
      blocks: [
        rich(
          "Perguntas comuns:\n• How are you? — Como você está?\n• How are you doing? — Como vai você?\n• How's it going? — Como está indo?\n• What's up? — E aí? (informal)\n\nQuando você está bem:\n• I'm good / I'm fine / I'm great / I'm doing well\n\nQuando está \"mais ou menos\":\n• I'm okay, thanks / I'm doing alright / I'm managing\n\nQuando está mal:\n• I'm not feeling well / I'm not okay / I'm not fine\n\nPerguntando \"e você?\":\n• And you? / How about you? / What about you?",
        ),
      ],
    },
    {
      title: "Lesson topic — Verb to be (interrogative)",
      blocks: [
        rich(
          "Para formar perguntas com o verbo to be, basta inverter a posição do verbo e do sujeito:\n\n• Affirmative: You are happy → Interrogative: Are you happy?\n• Affirmative: She is a teacher → Interrogative: Is she a teacher?\n• Affirmative: They are students → Interrogative: Are they students?\n\nAm I? · Are you? · Is he? · Is she? · Is it? · Are we? · Are they?\n\nRespostas (Yes/No):\n• Resposta curta: Yes, she is / No, she's not\n• Nas respostas curtas afirmativas NÃO usamos contração (Yes, she is). Usamos contração só nas negativas (No, she's not).",
        ),
      ],
    },
    {
      title: "Grammar — Demonstrative pronouns",
      blocks: [
        rich(
          "Os pronomes demonstrativos apontam/indicam pessoas ou coisas, mostrando se algo está perto ou longe, no singular ou plural.\n\n• this (esse/essa/isso) — singular, perto: This is my phone\n• that (aquele/aquela/aquilo) — singular, longe: That car is expensive\n• these (esses/essas) — plural, perto: These are my keys\n• those (aqueles/aquelas) — plural, longe: Those are my books\n\nContração: that + is = that's\nThis e that usam o verbo to be no singular (this is / that is). These e those usam no plural (these are / those are).\n\nWhat's this? / What's that? — \"O que é isso/aquilo?\". Resposta: It's a / It's an...",
        ),
      ],
    },
    {
      title: "Pronunciation — this, that & the 'th' sound",
      blocks: [
        pron("This or That?", [
          "This is my phone.",
          "That is your book.",
          "This is my friend.",
          "That is your house.",
          "This is nice.",
          "That is cool!",
        ]),
      ],
    },
    {
      title: "Dialogue",
      blocks: [
        dialogue([
          { speaker: "Leo", text: "Hey, Emma! How are you?" },
          { speaker: "Emma", text: "Hi, Leo! I'm doing well, thanks. How about you?" },
          { speaker: "Leo", text: "I'm okay, just a little tired. Is this seat taken?" },
          { speaker: "Emma", text: "No, it's free. Sit down!" },
          { speaker: "Leo", text: "Thanks. By the way, what's this on the table?" },
          { speaker: "Emma", text: "Oh, this? This is my new phone. Do you like it?" },
          { speaker: "Leo", text: "Yeah! It looks cool. And what's that over there?" },
          { speaker: "Emma", text: "That's my sister's bag. She's at the counter." },
        ]),
      ],
    },
    {
      title: "Exercises",
      blocks: [
        mc("___ this your book?", ["Am", "Is", "Are"], 1),
        mc("___ they your friends?", ["Am", "Is", "Are"], 2),
        mc("______ is my laptop. (perto, singular)", ["This", "That", "Those"], 0),
        fill("Reescreva como pergunta: She is your sister.", "is she your sister", ["is she your sister?"]),
        fill("Plural de 'this':", "these"),
        fill("Plural de 'that':", "those"),
      ],
    },
    {
      title: "Revisão",
      kind: "golden",
      blocks: [
        rich("Revisão — gabarite os exercícios desta parte da Lição 04."),
        mc("______ are my parents. (longe)", ["These", "Those", "This"], 1),
        fill("Faça a pergunta: você é estudante? (you / a student)", "are you a student", ["are you a student?"]),
      ],
    },
  ],
};

const LESSONS = [lesson02, lesson03, lesson04];

// ------------------------------------------------------------------
// Execução
// ------------------------------------------------------------------
async function insertReturningId(table, row) {
  const { data, error } = await admin.from(table).insert(row).select("id").single();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data.id;
}

async function main() {
  // 1. Aluno demo (idempotente).
  const { data: listed, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) throw listErr;
  let demo = listed.users.find((u) => u.email === DEMO_EMAIL);
  if (!demo) {
    const { data, error } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Aluno Demo" },
    });
    if (error) throw error;
    demo = data.user;
    console.log(`Aluno demo criado: ${DEMO_EMAIL}`);
  } else {
    console.log(`Aluno demo já existe: ${DEMO_EMAIL}`);
  }

  // 2. Curso de demonstração (idempotente: apaga e recria, cascata limpa tudo).
  await admin.from("courses").delete().eq("slug", COURSE_SLUG);

  const courseId = await insertReturningId("courses", {
    language: "en",
    level: "a1",
    title: "Inglês A1 Adulto",
    slug: COURSE_SLUG,
    description: "Curso de inglês nível A1 para adultos (USpeaK / Mr. Dave Idiomas).",
    is_published: true,
  });
  const moduleId = await insertReturningId("modules", {
    course_id: courseId,
    title: "Module 01 — Foundations",
    position: 0,
  });

  let counts = { lessons: 0, parts: 0, blocks: 0, exercises: 0 };

  for (const [li, lesson] of LESSONS.entries()) {
    const lessonId = await insertReturningId("lessons", {
      module_id: moduleId,
      course_id: courseId,
      title: lesson.title,
      position: li,
      is_published: true,
    });
    counts.lessons++;

    for (const [pi, part] of lesson.parts.entries()) {
      const partId = await insertReturningId("parts", {
        lesson_id: lessonId,
        course_id: courseId,
        title: part.title,
        position: pi,
        kind: part.kind ?? "regular",
      });
      counts.parts++;

      for (const [bi, block] of part.blocks.entries()) {
        const blockId = await insertReturningId("blocks", {
          part_id: partId,
          lesson_id: lessonId,
          course_id: courseId,
          type: block.type,
          position: bi,
          data: block.data,
        });
        counts.blocks++;

        if (block.solution) {
          const { error } = await admin.from("exercise_solutions").insert({
            block_id: blockId,
            course_id: courseId,
            solution: block.solution,
          });
          if (error) throw new Error(`exercise_solutions: ${error.message}`);
          counts.exercises++;
        }
      }
    }
  }

  // 3. Matrícula do aluno demo.
  await admin
    .from("enrollments")
    .insert({ user_id: demo.id, course_id: courseId, status: "active" });

  console.log("Seed concluído:", counts);
  console.log(`Login demo: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main().catch((e) => {
  console.error("Falha no seed:", e.message);
  process.exit(1);
});
