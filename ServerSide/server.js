// server.js
import http from 'http';
import url from 'url';
import { pipeline } from '@xenova/transformers';

class Server {
  constructor(port) {
    this.port = port;
    this.server = http.createServer(this.handleRequest.bind(this));
    this.generator = null; // Will hold the text-generation pipeline
    this.loadModel(); // Load the model when the server starts
  }

  async loadModel() {
    console.log('Loading model...');
    this.generator = await pipeline('text-generation', 'Xenova/gpt-neo-125M');
    console.log('Model loaded.');
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

    const postMethod = method === 'POST';

    switch (parsedUrl.pathname) {
      case '/api/generate-story':
        if (postMethod) await this.handleGenerateStory(req, res);
        break;
      // Handle other routes (e.g., /api/register, /api/login)
      default:
        res.writeHead(404);
        res.end();
    }
  }

  async handleGenerateStory(req, res) {
    try {
      const body = await this.getRequestBody(req);
      const data = JSON.parse(body);
      const prompt = data.prompt;
      // No need for storySoFar if we're replacing the story each time
      // const storySoFar = data.storySoFar || '';

      console.log('Received prompt:', prompt);

      // Generate story text based on the prompt
      const generatedStoryPart = await this.generateStory(prompt);

      // Generate 4 prompts
      const promptOptions = [];
      for (let i = 0; i < 4; i++) {
        const generatedPrompt = await this.generatePrompt(generatedStoryPart);
        promptOptions.push(generatedPrompt);
      }

      console.log('Generated story part:', generatedStoryPart);
      console.log('Generated prompts:', promptOptions);

      // Send response back to the client
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          generatedStoryPart,
          promptOptions,
        })
      );
    } catch (error) {
      console.error('Error generating story:', error);
      res.writeHead(500);
      res.end('Error generating story');
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
    const generatedStoryPart = storyOutput[0].generated_text.trim();
    return generatedStoryPart;
  }

  async generatePrompt(storyContext, existingPrompts = []) {
    let attempts = 0;
    const maxAttempts = 10;
    let uniquePrompt = null;
  
    while (attempts < maxAttempts && (!uniquePrompt || existingPrompts.includes(uniquePrompt))) {
      const promptOutput = await this.generator(storyContext + '\nNext:', {
        max_length: 30, // Set max_length to 30 characters
        num_return_sequences: 1,
        no_repeat_ngram_size: 2,
        do_sample: true,
        top_k: 50,
        top_p: 1, // Increase randomness
        temperature: 2, // Slightly higher temperature for more diversity
      });
  
      let generatedPrompt = promptOutput[0].generated_text.trim();
  
      // Remove the 'Next:' prefix if present
      if (generatedPrompt.toLowerCase().startsWith('next:')) {
        generatedPrompt = generatedPrompt.substring(5).trim();
      }
  
      // Trim to max 30 characters
      generatedPrompt = generatedPrompt.substring(0, 30).trim();
  
      // Remove any incomplete words at the end
      generatedPrompt = generatedPrompt.replace(/\w+$/, '').trim();
  
      // Check if the prompt is unique and meaningful
      if (generatedPrompt.length >= 5 && !existingPrompts.includes(generatedPrompt)) {
        uniquePrompt = generatedPrompt;
      }
  
      attempts++;
    }
  
    // Fallback to default if we can't generate a unique prompt
    return uniquePrompt || 'Continue the current story...';
  }  

  // Helper method to get the request body
  getRequestBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        resolve(body);
      });
      req.on('error', (err) => {
        reject(err);
      });
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
