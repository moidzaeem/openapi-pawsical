const express = require('express');
const app = express();
const port = 3000;
const axios = require('axios'); // Ensure axios is imported for making HTTP requests.
const { OpenAI } = require('openai'); // Use destructuring to get OpenAI class
const openai = new OpenAI({
    apiKey: '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', // make sure to set your OpenAI API key
});
app.use(express.json()); // Middleware for parsing JSON request bodies

// Create a router for API routes
const apiRouter = express.Router();

// Define routes on the `apiRouter`
apiRouter.get('/', (req, res) => {
    res.send('Welcome to the OPEN API PAWSICAL!');
});


apiRouter.post('/generate-lyrics', async (req, res) => {
    const data = req.body;
    const run = await openai.beta.threads.createAndRun({
        assistant_id: "asst_o3R0qELTTNhuzZM4soEqdFnk",
        thread: {
            messages: [
                {
                    role: "user",
                    content: `Name is ${data.pet_name}, Pet Type: ${data.pet_type}, Gender: ${data.pet_gender},Color: ${data.pet_color}
                Description:${data.description}.
                `},
            ],
        },
        stream: true
    });
    let generatedContent = ''; // To accumulate the content from the stream

    for await (const event of run) {
        if (event.event === 'thread.message.completed' && event.data.role === 'assistant') {
            const contentArray = event.data.content;

            // Loop through the content array and extract the text value
            if (Array.isArray(contentArray)) {
                contentArray.forEach(item => {
                    if (item.text && item.text.value) {
                        generatedContent += item.text.value; // Accumulate the song lyrics
                    }
                });
            }
        }
    }
    // need to call suno api

    if (generatedContent) {
        const sunoResponse = await axios.post('http://localhost:3001/api/custom_generate', {
            make_instrumental: false,
            prompt: generatedContent,
            wait_audio: false
        });
        console.log(sunoResponse);
        const sunoGeneratedContent = sunoResponse.data; // Assume this is the response field

        // Return both OpenAI and Suno generated content
        res.json({
            message: 'Lyrics generated successfully!',
            openaiContent: generatedContent,
            sunoContent: sunoGeneratedContent || 'No content generated by Suno.',
        });
    } else {
        res.json({
            message: 'Lyrics generated successfully, but no content from OpenAI.',
            openaiContent: 'No content generated.',
            sunoContent: 'No content generated.',
        });
    }

    res.json({ message: 'Lyrics generated successfully!', data: generatedContent || 'No content generated.' });
    // res.json({ message: 'Lyrics generated successfully!', data: 'No content generated.' });

});

app.use('/api', apiRouter);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});