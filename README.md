# TruthPrism 🔍

TruthPrism is an advanced, multimodal fake news detection and fact-checking system. It uses cutting-edge AI to instantly verify claims by cross-referencing global news sources in real time. 

Built with **React, Node.js, and Google Gemini 2.5 Flash**, TruthPrism is designed to be highly resilient, accurate, and completely automated.

---

## 🌟 Key Features

*   **Multimodal Input**: Fact-check plain text claims or upload screenshots/images of news articles and social media posts.
*   **Free Local OCR**: Uses `Tesseract.js` for 100% free, local Optical Character Recognition (no expensive cloud vision APIs required).
*   **Smart Claim Routing**: Uses AI to instantly classify inputs into `Breaking News`, `General Facts`, or `Future Predictions` to optimize API usage and prevent AI hallucinations.
*   **Real-time Evidence Gathering**: Instantly fetches live, up-to-the-minute articles from top global sources like **BBC News**, **Times of India**, and **GNews**.
*   **AI Judge Engine**: Google Gemini acts as an impartial judge, evaluating the claim strictly against the fetched evidence to generate a final credibility score (0-100).
*   **Live Dashboard**: A dynamic tracking dashboard displaying real-time metrics, risk statistics, and a history of recently analyzed claims.

---

## 🏗️ Architecture & Tech Stack

### Frontend (Client-Side)
*   **React 18** (built with Vite for ultra-fast performance)
*   **TypeScript** for type safety
*   **React Router DOM** for seamless navigation
*   Custom UI with glassmorphism, animated gradients, and interactive components.

### Backend (Server-Side)
*   **Node.js & Express.js**
*   **Multer** (for handling in-memory image uploads)
*   **Tesseract.js** (for OCR text extraction from images)
*   **Axios** for rapid API data fetching.

### APIs & Models
*   **Google Gemini 2.5 Flash**: Core reasoning and claim extraction (features automatic 4-key rotation to prevent rate limiting).
*   **Hugging Face Inference API**: NLP classification.
*   **NewsAPI / GNews**: Real-time evidence cross-referencing.

---

## ⚙️ How It Works (The Pipeline)

1.  **Ingestion**: User submits text or uploads an image (OCR extracts the text automatically).
2.  **Extraction**: The AI strips away opinions and extracts the core factual claim.
3.  **Classification**: The system determines if the claim is a current event, a timeless fact, or a future prediction.
4.  **Evidence Collection**: (If breaking news) Live articles are fetched from global news APIs.
5.  **Reasoning**: Gemini compares the user's claim directly against the live evidence.
6.  **Scoring**: The system outputs a Credibility Score, Risk Status (`Likely False`, `Uncertain`, `Likely True`), and a detailed explanation citing its sources.

---

## 🚀 Setup & Installation

### Prerequisites
*   Node.js (v18 or higher)
*   NPM

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/archanajalihal/Truth-Prism.git
cd Truth-Prism
\`\`\`

### 2. Environment Variables
Create a \`.env\` file in the root directory and add the following keys:
\`\`\`env
NODE_ENV=development
PORT=5000

# AI Models
GEMINI_API_KEY=your_key_here
GEMINI_API_KEY_2=your_key_here
GEMINI_API_KEY_3=your_key_here
GEMINI_API_KEY_4=your_key_here
HUGGINGFACE_API_KEY=your_key_here

# News Sources
NEWS_API_KEY=your_key_here
GNEWS_API_KEY=your_key_here
CURRENTS_API_KEY=your_key_here
NEWSDATA_API_KEY=your_key_here
\`\`\`

### 3. Running Locally
This project uses a unified script to run both the frontend and backend simultaneously.

Install root dependencies:
\`\`\`bash
npm install
\`\`\`

Install frontend dependencies:
\`\`\`bash
cd frontend && npm install && cd ..
\`\`\`

Start the backend server:
\`\`\`bash
npm start
\`\`\`
*(Server runs on \`http://localhost:5000\`)*

Start the frontend server (in a new terminal):
\`\`\`bash
npm run dev
\`\`\`
*(App runs on \`http://localhost:5173\`)*

---

## ☁️ Deployment (Render)
This project is configured for a single-service full-stack deployment on **Render**.

*   **Build Command**: \`npm install && npm run build\`
*   **Start Command**: \`npm start\`
*   *Note: Ensure all environment variables from your \`.env\` file are added to the Render dashboard.*
