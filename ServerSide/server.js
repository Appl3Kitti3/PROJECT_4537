import http from 'http';
import url from 'url';
import { pipeline } from '@xenova/transformers';
import connectDB from './db.js'; // MongoDB connection
import dotenv from 'dotenv'; // Environment variables
import { authRoutes } from './routes/auth.js'; // Ensure correct import

dotenv.config(); // Load environment variables

class Server {
  constructor(port) {
    this.port = port;
    this.server = http.createServer(this.handleRequest.bind(this));
    this.generator = null; // For the text-generation pipeline
    connectDB(); // Connect to MongoDB at server startup
    this.loadModel(); // Load the text generation model
  }

  async loadModel() {
    try {
      console.log('Loading model...');
      this.generator = await pipeline('text-generation', 'Xenova/gpt-neo-125M');
      console.log('Model loaded.');
    } catch (error) {
      console.error('Error loading model:', error);
      process.exit(1);
    }
  }

  async handleRequest(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const parsedUrl = url.parse(req.url, true);
    const method = req.method;

    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const isPostMethod = method === 'POST';

    switch (parsedUrl.pathname) {
      case '/api/generate-story':
        if (isPostMethod) await this.handleGenerateStory(req, res);
        break;

      case '/api/auth/login':
        if (isPostMethod) await this.handleLogin(req, res);
        break;

      case '/api/auth/register':
        if (isPostMethod) await this.handleRegister(req, res);
        break;

      default:
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route not found' }));
    }
  }

  async handleGenerateStory(req, res) {
    try {
      const body = await this.getRequestBody(req);
      const { prompt } = JSON.parse(body);

      console.log('Received prompt:', prompt);

      const generatedStoryPart = await this.generateStory(prompt);
      const promptOptions = [];

      for (let i = 0; i < 4; i++) {
        const generatedPrompt = await this.generatePrompt(generatedStoryPart);
        promptOptions.push(generatedPrompt);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ generatedStoryPart, promptOptions }));
    } catch (error) {
      console.error('Error generating story:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Error generating story' }));
    }
  }

  async handleLogin(req, res) {
    try {
      const body = await this.getRequestBody(req);
      const { email, password } = JSON.parse(body);
  
      console.log('Login request received:', { email, password }); // Log the input
  
      const result = await authRoutes.login(email, password);
  
      if (result.success) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ token: result.token }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: result.error }));
      }
    } catch (error) {
      console.error('Login error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Login failed' }));
    }
  }
  

  async handleRegister(req, res) {
    try {
      const body = await this.getRequestBody(req);
      const { username, email, password } = JSON.parse(body);

      if (!username || !email || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'All fields are required' }));
      }

      const result = await authRoutes.register(username, email, password);

      if (result.success) {
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User registered successfully' }));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: result.error }));
      }
    } catch (error) {
      console.error('Register error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Registration failed' }));
    }
  }

  async generateStory(prompt) {
    const storyOutput = await this.generator(prompt, {
      max_length: 100,
      num_return_sequences: 1,
      no_repeat_ngram_size: 2,
      do_sample: true,
      top_k: 50,
      top_p: 0.95,
      temperature: 1.0,
    });
    return storyOutput[0].generated_text.trim();
  }

  async generatePrompt(storyContext) {
    const promptOutput = await this.generator(`${storyContext}\nNext:`, {
      max_length: 30,
      num_return_sequences: 1,
      no_repeat_ngram_size: 2,
      do_sample: true,
      top_k: 50,
      top_p: 1.0,
      temperature: 2.0,
    });

    let generatedPrompt = promptOutput[0].generated_text.trim();
    if (generatedPrompt.toLowerCase().startsWith('next:')) {
      generatedPrompt = generatedPrompt.substring(5).trim();
    }

    return generatedPrompt.substring(0, 30).replace(/\w+$/, '').trim();
  }

  getRequestBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => resolve(body));
      req.on('error', (err) => reject(err));
    });
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`Server is listening on port ${this.port}`);
    });
  }
}

const serverInstance = new Server(process.env.PORT || 8080);
serverInstance.start();
