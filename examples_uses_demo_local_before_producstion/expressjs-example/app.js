const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
// Adjust the path if gigli.js is installed differently
const { object, string, number, validate } = require('gigli.js');

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(bodyParser.json());

// Example schema
const userSchema = object({
  name: string().min(2),
  email: string().email(),
  age: number().min(18).max(29),
});

app.post('/api/register', async (req, res) => {
  const result = await validate(userSchema, req.body);
  if (result.valid) {
    res.json({ success: true, data: result.value });
  } else {
    res.status(400).json({ success: false, errors: result.errors });
  }
});

app.get('/', (req, res) => {
  res.send('Express + gigli.js API is running');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
