require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply('Salut! Sunt un chatbot alimentat de OpenAI. Întreabă-mă orice!');
});

bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: userMessage }],
        max_tokens: 100
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const botReply = response.data.choices[0].message.content.trim();
    ctx.reply(botReply);
  } catch (error) {
    console.error('Error:', error);
    ctx.reply('Ne pare rău, a apărut o eroare. Încercați din nou mai târziu.');
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
