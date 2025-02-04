require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const urls = [];
let urlCounter = 1;

app.post('/api/shorturl', function(req, res) {
  const url = req.body.url;

  try {
    const urlObject = new URL(url);
    
    dns.lookup(urlObject.hostname, (err, address) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }
      
      const shortUrl = urlCounter++;
      urls.push({ shortUrl, url });
      res.json({ original_url: url, short_url: shortUrl });
    });
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:shortUrl', function(req, res) {
  const shortUrl = parseInt(req.params.shortUrl);
  const urlObj = urls.find(u => u.shortUrl === shortUrl);
  if (urlObj) {
    res.redirect(urlObj.url);
  } else {
    res.json({ error: 'invalid url' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
