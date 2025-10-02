import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const SERVER_PORT = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Welcome to the API!");
})

app.post('/greet', (req, res) => {
    const { name } = req.body;
    console.log(`Server processing name: ${name}`)
    res.json({ greeting: `Hello, ${name}!` });
});

app.listen(SERVER_PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${SERVER_PORT}`);
    console.log(`See at http://localhost:${SERVER_PORT}/`)
})