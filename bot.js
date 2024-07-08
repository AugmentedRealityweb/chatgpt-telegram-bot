require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const CHANNEL_ID = '@DadJokeshourly'; // Username-ul canalului tău

// Funcție pentru a obține un răspuns de la OpenAI
const getOpenAIResponse = async (prompt) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150
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
    console.error('Error fetching response from OpenAI:', error);
    return 'Sorry, I couldn\'t think of a response right now. Please try again later.';
  }
};

// Funcție pentru a obține o dad joke de la OpenAI
const getDadJoke = async () => {
  return await getOpenAIResponse('Tell me a dad joke.');
};

bot.start((ctx) => {
  ctx.reply('Hello! I\'m a dad jokes bot. Ask me anything, and I\'ll tell you a joke!');
});

bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;
  const response = await getOpenAIResponse(userMessage);
  ctx.reply(response);
});

// Funcție pentru a posta automat în canal
const postToChannel = async () => {
  console.log('Attempting to post to channel...');
  const joke = await getDadJoke();
  console.log('Fetched joke:', joke);
  try {
    const result = await bot.telegram.sendMessage(CHANNEL_ID, joke);
    console.log('Message posted to channel:', result);
  } catch (error) {
    console.error('Error posting message to channel:', error);
  }
};

// Postează un mesaj în canal la fiecare oră
setInterval(postToChannel, 60 * 60 * 1000); // 1 oră în milisecunde

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
