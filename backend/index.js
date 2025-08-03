// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '.env.dev' });

import express from 'express';
import authUser from './routes/authUser.js';
import authMiddle from './middleware/authMiddle.js';
import petition from './routes/petition.js';

// App Variables
const app = express();
const PORT = process.env.PORT || 3001; // Use environment variable PORT or default to 4000


//middleware
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Hello, Express!'); // Simple response for the root route
});


app.use('/auth', authUser);
app.use('/petition', authMiddle, petition);



console.log("DB URL:", process.env.DATABASE_URL);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});