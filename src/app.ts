import express from "express"

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, '0.0.0.0', () => {
  return console.log(`Express is listening at http://0.0.0.0:${port}`);
});