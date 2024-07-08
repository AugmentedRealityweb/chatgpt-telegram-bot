require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const CHANNEL_ID = '@DadJokesGPT'; // Username-ul canalului tău

// Funcție pentru a obține o dad joke de la OpenAI
const getDadJoke = async () => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Tell me a dad joke.' }],
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
    console.error('Error fetching dad joke:', error);
    return 'Sorry, I couldn\'t think of a joke right now. Please try again later.';
  }
};

bot.start((ctx) => {
  ctx.reply('Hello! I\'m a dad jokes bot. Ask me anything, and I\'ll tell you a joke!');
});

bot.on('text', async (ctx) => {
  const joke = await getDadJoke();
  ctx.reply(joke);
});

// Funcție pentru a posta automat în canal
const postToChannel = async () => {
  const joke = await getDadJoke();
  try {
    await bot.telegram.sendMessage(CHANNEL_ID, joke);
    console.log('Message posted to channel:', joke);
  } catch (error) {
    console.error('Error posting message to channel:', error);
  }
};

// Postează un mesaj în canal la fiecare oră
setInterval(postToChannel, 60 * 60 * 1000); // 1 oră în milisecunde

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
