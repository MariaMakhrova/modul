const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');

// Підключення до бази даних MongoDB
mongoose.connect('mongodb://localhost:27017/tasksApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const app = express();

// Схема для збереження інформації про запити у базі даних
const RequestSchema = new mongoose.Schema({
  endpoint: String,
  requestData: Object,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Request = mongoose.model('Request', RequestSchema);

// Middleware для обробки JSON у тілі запиту
app.use(express.json());

// Middleware для збереження інформації про кожний запит у базі даних
function logRequest(req, res, next) {
  const requestData = {
    method: req.method,
    params: req.params,
    query: req.query,
    body: req.body
  };

  const requestLog = new Request({ endpoint: req.originalUrl, requestData });
  requestLog.save();

  next();
}

// Middleware для перевірки валідності даних для обчислення площі трикутника
function validateTriangleData(req, res, next) {
  const schema = Joi.object({
    sideA: Joi.number().positive().required(),
    sideB: Joi.number().positive().required(),
    angle: Joi.number().positive().max(180).required() // Максимальний кут - 180 градусів
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
}

// Middleware для перевірки валідності даних для обчислення виразу
function validateExpressionData(req, res, next) {
  const schema = Joi.object({
    a: Joi.number().required(),
    n: Joi.number().positive().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
}

// Ендпоінт для обчислення площі трикутника
app.post('/calculate-triangle', logRequest, validateTriangleData, async (req, res) => {
  const { sideA, sideB, angle } = req.body;

  // Обчислення площі трикутника
  const radians = angle * Math.PI / 180;
  const area = 0.5 * sideA * sideB * Math.sin(radians);

  res.json({ area });
});

// Ендпоінт для обчислення виразу a(a+1)...(a+n+1)
app.post('/calculate-expression', logRequest, validateExpressionData, async (req, res) => {
  const { a, n } = req.body;

  let result = 1;
  for (let i = 0; i <= n; i++) {
      result *= (a + i + 1);
  }

  res.json({ result });
});

// Прослуховування порту 3000
app.listen(3000, () => {
  console.log('Сервер запущено на порті 3000');
});
