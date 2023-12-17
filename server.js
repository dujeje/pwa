const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const fs = require('fs');

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/api/recipes', (req, res) => {
    const recipe = req.body;
    console.log('Received recipe:', recipe);
    res.status(200).send('Recipe received successfully');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});


