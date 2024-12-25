import express, { Request, Response, NextFunction } from "express";
import { openai } from '@ai-sdk/openai';
import { CoreMessage, streamText } from 'ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Store messages per session (in memory - should be moved to a proper database for production)
const sessions: Record<string, CoreMessage[]> = {};

interface ChatRequest {
  message: string;
  sessionId: string;
}

const chatHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, sessionId } = req.body as ChatRequest;
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'Missing sessionId or message' });
    }

    // Initialize session if it doesn't exist
    if (!sessions[sessionId]) {
      sessions[sessionId] = [];
    }

    // Add user message to history
    sessions[sessionId].push({ role: 'user', content: message });

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const result = streamText({
      model: openai('gpt-4'),
      messages: sessions[sessionId],
    });

    let fullResponse = '';

    // Stream the response
    for await (const delta of result.textStream) {
      fullResponse += delta;
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }

    // Add assistant's message to history
    sessions[sessionId].push({ role: 'assistant', content: fullResponse });

    // End the stream
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    next(error);
  }
};

app.post('/chat', chatHandler);

// Health check endpoint
app.get('/', (_req: Request, res: Response) => {
  res.send('Chat API is running');
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.write(`data: ${JSON.stringify({ error: 'Server error occurred' })}\n\n`);
  res.end();
});

app.listen(port, '0.0.0.0', () => {
  return console.log(`Express is listening at http://0.0.0.0:${port}`);
});