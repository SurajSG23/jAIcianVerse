# jAIcianVerse

## Steps for Execution

1. Make sure the required tools are installed.
	- Node.js and npm for the frontend, backend, and AI server
	- Python for the RAG-BOT service
	- Ollama if you want local model responses

2. Install the root dependencies from the project folder.
	```bash
	npm install
	```

3. Install dependencies for each service if they are not already installed.
	```bash
	cd Client
	npm install

	cd ../Server
	npm install

	cd ../AI-Server
	npm install

	cd RAG-BOT
	pip install -r requirements.txt
	```

4. Configure the environment variables before starting the app.
	- `Server/.env` for backend settings such as database URL, JWT secret, and API keys
	- `AI-Server/.env` for Ollama and RAG service settings
	- `Client/.env` if the frontend needs a custom API base URL

5. Start the complete project from the root folder.
	```bash
	npm run jaicianverse
	```

6. If you prefer to run each service manually, open separate terminals and start them in this order.
	```bash
	cd Client
	npm run dev

	cd ../Server
	npm run start

	cd ../AI-Server
	npm run start

	cd RAG-BOT
	python app.py
	```

7. Open the frontend in your browser after Vite starts.
	- Default Vite address is usually `http://localhost:5173`
	- Backend and AI service ports depend on the values in their `.env` files

8. If you are using the AI chatbot or retrieval features, make sure the Ollama service and the RAG-BOT Python service are both running before testing them.
