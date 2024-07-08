require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const CHANNEL_ID = '@DadJokeshourly'; // Username-ul canalului tău

const categories = [
  { prompt: 'Tell me 5 fun facts about the Eiffel Tower.', title: '5 Fun Facts about the Eiffel Tower' },
  { prompt: 'Tell me 5 horror facts about haunted houses.', title: '5 Horror Facts about Haunted Houses' },
  { prompt: 'Tell me 5 interesting facts about space.', title: '5 Interesting Facts about Space' }
];

let previousFacts = new Set(); // Pentru a stoca faptele anterioare și a preveni repetarea

// Funcție pentru a obține fapte de la OpenAI
const getFacts = async (category) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: category.prompt }],
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

    let formattedFacts = `${category.title}\n\n`;
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
  console.log('Attempting to post to channel with category:', category.prompt);

  const facts = await getFacts(category);
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
