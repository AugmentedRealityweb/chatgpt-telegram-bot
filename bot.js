require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const CHANNEL_ID = '@DadJokesGPT'; // Username-ul canalului tău

const categories = [
  { type: 'fun', title: '5 Fun Facts about' },
  { type: 'horror', title: '5 Horror Facts about' },
  { type: 'interesting', title: '5 Interesting Facts about' }
];

// Funcție pentru a obține subiect aleatoriu
const getRandomSubject = async (type) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `Give me a random ${type} subject to write about.` }],
        max_tokens: 50
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error fetching random subject from OpenAI:', error);
    return 'something interesting'; // fallback subject
  }
};

let previousFacts = new Set(); // Pentru a stoca faptele anterioare și a preveni repetarea

// Funcție pentru a obține fapte de la OpenAI
const getFacts = async (category, subject) => {
  const prompt = `Tell me 5 ${category.type} facts about ${subject}.`;
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    let facts = response.data.choices[0].message.content.trim().split('\n').filter(fact => fact);
    facts = facts.map(fact => fact.replace(/^\d+\.\s*/, '').trim()); // Elimină numerele inițiale

    const uniqueFacts = facts.filter(fact => !previousFacts.has(fact));

    uniqueFacts.forEach(fact => previousFacts.add(fact));

    if (uniqueFacts.length === 0) {
      return 'No new facts available right now. Please try again later.';
    }

    let formattedFacts = `${category.title} ${subject}\n\n`;
    uniqueFacts.slice(0, 5).forEach((fact, index) => {
      formattedFacts += `${index + 1}. ${fact}\n\n`;
    });

    return formattedFacts.trim(); // Eliminăm spațiul suplimentar de la sfârșit
  } catch (error) {
    console.error('Error fetching facts from OpenAI:', error);
    return 'Sorry, I couldn\'t think of any facts right now. Please try again later.';
  }
};

// Funcție pentru a posta automat în canal
const postToChannel = async () => {
  const category = categories[Math.floor(Math.random() * categories.length)];
  const subject = await getRandomSubject(category.type);
  console.log('Attempting to post to channel with category and subject:', category.type, subject);

  const facts = await getFacts(category, subject);
  console.log('Fetched facts:', facts);

  try {
    const result = await bot.telegram.sendMessage(CHANNEL_ID, facts);
    console.log('Message posted to channel:', result);
  } catch (error) {
    console.error('Error posting message to channel:', error);
  }
};

// Postează un mesaj în canal la fiecare 2 minute
setInterval(postToChannel, 2 * 60 * 1000); // 2 minute în milisecunde

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
