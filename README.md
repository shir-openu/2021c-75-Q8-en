# 2021c-75-Q8: Digital Friend for ODE Exercise

This project adds an AI-powered "Digital Friend" to help students solve a 2×2 variable-coefficient system of differential equations using power ansatz and reduction of order.

## Project Structure

```
2021c-75-Q8/
├── api/
│   └── ai-hint.js      # Serverless function for Gemini AI
├── .env                 # API key (DO NOT commit to git!)
├── .gitignore          # Excludes .env and node_modules
├── index.html          # Main exercise page with DF button
├── package.json        # Node.js dependencies
├── vercel.json         # Vercel configuration
└── README.md           # This file
```

## Local Development

### Prerequisites
- Node.js (version 18 or higher)
- npm (comes with Node.js)

### Setup Steps

1. **Open terminal/command prompt in the project folder**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run locally:**
   ```bash
   npm start
   ```

4. **Open in browser:**
   - Go to: http://localhost:3000

### Testing the Digital Friend
1. Enter values in the input fields
2. Click the "Digital Friend" button
3. The AI will analyze your answer and provide guidance

## Deployment to Vercel

1. Push to GitHub (make sure .env is in .gitignore!)
2. Import project in Vercel
3. Add environment variable: `GOOGLE_API_KEY` = your API key
4. Deploy

## The Exercise (Exam 2021c, Moed 75, Question 8)

Find a homogeneous solution with t^α component, then find all solutions of the non-homogeneous system:
- dx/dt = (3/t)x - 4ty + 5t³
- dy/dt = (1/t³)x + (5/t)y - 4t

Features: variable coefficients (Euler-type), power ansatz, reduction of order, integrating factor, direct integration.
