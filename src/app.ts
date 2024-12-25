import { CoreMessage, streamText } from "ai"
import dotenv from "dotenv"
import express, { ErrorRequestHandler, RequestHandler } from "express"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Configure Google Generative AI
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

interface ChatRequest {
  messages: CoreMessage[];
}

const chatHandler: any = async (req, res, next) => {
  const { messages } = req.body as ChatRequest;

  const result = streamText({
    model: google('gemini-1.5-pro'),
    messages,
  });

  return result.toDataStreamResponse();
};

app.post('/chat', chatHandler);

// Health check endpoint
const healthCheck: RequestHandler = (_req, res) => {
  res.send('Chat API is running');
};

app.get('/', healthCheck);

// Error handler
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('Server error:', err);
  res.write(`data: ${JSON.stringify({ error: 'Server error occurred' })}\\n\\n`);
  res.end();
};

app.use(errorHandler);

app.listen(port, '0.0.0.0', () => {
  return console.log(`Express is listening at http://0.0.0.0:${port}`);
});
