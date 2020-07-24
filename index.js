const express = require('express');
const line = require('@line/bot-sdk');
const cors = require('cors');
const axios = require('axios');
const _ = require('lodash');

require('dotenv').config();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET_TOKEN,
};

const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());

app.post('/webhook', line.middleware(config), (req, res) => {
  console.log(req.body.events);
  Promise.all(req.body.events.map(handleEvent)).then(result =>
    res.json(result)
  );
});

const client = new line.Client(config);

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const fixerAPI = `http://data.fixer.io/api/latest?access_key=${process.env.FIXER_API}`;

  const fetchCurrencies = async () => {
    try {
      const result = await axios.get(fixerAPI);
      const currencies = result.data.rates;

      const thaiCurrenciesBase = _.mapValues(currencies, n => n / 36.258593);

      const clientCurrencyNumber = Number(event.message.text.split(' ')[0]);
      const clientCurrencyMessage = event.message.text.split(' ')[1];

      Object.keys(thaiCurrenciesBase).forEach(currency => {
        if (currency === clientCurrencyMessage) {
          messages = {
            type: 'text',
            text: `${clientCurrencyNumber} ${currency} = ${
              clientCurrencyNumber / thaiCurrenciesBase[currency]
            } THB`,
          };

          return client.replyMessage(event.replyToken, messages);
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  fetchCurrencies();
}

app.listen(PORT, () => {
  console.log(`Server in running on port ${PORT}`);
});
