require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

// Endpoint for incoming webhook
app.post('/webhook', async (req, res) => {
    try {
        const eventData = req.body;

        // Construct a message for Slack
        const slackMessage = {
            text: `🚰 Enagic Event: ${JSON.stringify(eventData, null, 2)}`,
        };

        // Send message to Slack
        await axios.post(SLACK_WEBHOOK_URL, slackMessage);

        res.status(200).send({ success: true, message: "Webhook received and processed." });
    } catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).send({ success: false, message: "Internal server error." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
