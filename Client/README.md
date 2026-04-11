# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
The **Materials Page** in **jAIcianVerse** is designed to be a one-stop hub for academic excellence, specifically tailored for each unit of your syllabus. When you select a subject and a specific unit, you are presented with six core features that combine traditional study resources with cutting-edge AI.

Here is a simple breakdown of each feature and the technology that powers it:

### 1. **Study Hub**
*   **What it is:** Your digital library for the specific unit. It contains curated notes, PDFs, and previous year's materials uploaded by students and teachers.
*   **The Tech:** It uses a **Cloud-based File Management** system (integrated with **ImageKit** or similar storage) and a **MongoDB** backend to store and fetch documents. It also features a community-driven **Upvote System** so the most helpful notes naturally rise to the top.

### 2. **Ask AI Tutor**
*   **What it is:** A specialized chatbot that knows your specific unit's content. You can ask questions like "Explain Dijkstra's algorithm from this unit," and it gives you a precise answer.
*   **The Tech:** This is powered by **RAG (Retrieval-Augmented Generation)**. 
    *   **Retrieval:** A Python service (**RAG-BOT**) searches a "knowledge base" (like college.data.txt) for the most relevant text chunks using **Sentence-Transformers**.
    *   **Generation:** The relevant info is fed into a Large Language Model (like **Ollama** or **Gemini**) so the AI answers based *only* on your syllabus, reducing "hallucinations" (fake info).

### 3. **Smart Summary (AI Avatar)**
*   **What it is:** A virtual "AI Teacher" that talks to you. It provides a spoken and written summary of the entire unit to help you grasp the "big picture" quickly.
*   **The Tech:** It combines **AI Text Generation** for the summary with **Web Speech API (TTS)** for the voice. The interface also synchronizes a video avatar and scrolling subtitles to make the learning experience more engaging and accessible.

### 4. **Quick Quiz**
*   **What it is:** A gamified way to test your knowledge. It generates multiple-choice questions (MCQs) on the fly based on the unit you are studying.
*   **The Tech:** It uses **Dynamic Prompting** with LLMs. The app sends the unit name to the AI, which returns a structured JSON containing questions, options, correct answers, and explanations. The frontend then renders this into an interactive **Carousel Quiz**.

### 5. **Hot Concepts (Trending Page)**
*   **What it is:** A dynamic discussion forum where you can see what other students are asking and discussing about this specific unit.
*   **The Tech:** This is a **Social Learning Engine**. It uses a specialized **Discussion Schema** in the database to link questions and answers to specific units. It also includes an **Incentive System** where students earn "points" for helping others, encouraging a collaborative learning environment.

### 6. **Visual Vault**
*   **What it is:** A curated collection of video lectures from YouTube and platforms like NPTEL or Udemy, specifically filtered for that unit.
*   **The Tech:** It uses the **YouTube Data API v3**. Instead of you searching blindly, the app automatically constructs a precise search query using your `Subject Name + Unit Title` and fetches the most relevant educational videos directly into your dashboard.