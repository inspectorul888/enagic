const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for external webhook connections
app.use(cors());
app.use(bodyParser.json());

// Load Slack Webhook URL and API URL from environment variables
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const ENAGIC_AI_API_URL = process.env.ENAGIC_AI_API_URL; // Replace with relevant API when available

// Add keyword list for Enagic-related topics
const FILTER_KEYWORDS = [
  "alkaline water", "ionized water", "Kangen Water", "hydrogen-rich water", 
  "water ionizer", "best drinking water", "hydration benefits", "electrolyzed water",
  "water purification", "structured water", "best water for health", 
  "antioxidant water", "alkaline diet", "acidic vs alkaline", "anti-oxidation", 
  "anti-inflammation", "water detox", "removing toxins with water", 
  "hydration for health", "Kangen machine", "water experiment", "how to stay hydrated",
  "healthy drinking water", "filtered water vs bottled water", "alkaline vs acidic water",
  "reverse osmosis vs ionized water", "best water for inflammation", "water for skin health",
  "hydration and energy", "dehydration effects", "water and pH balance", 
  "why drink ionized water", "water and digestion", "alkaline water benefits"
];

// Function to check if a post contains any relevant keyword
const containsKeyword = (content) => {
  return FILTER_KEYWORDS.some(keyword => content.toLowerCase().includes(keyword.toLowerCase()));
};

// ✅ Webhook to receive data from Enagic AI or any lead system
app.post("/proxy-webhook", async (req, res) => {
  try {
    const leads = req.body.items || [];
    console.log("Received Leads:", leads.length);

    for (const lead of leads) {
      if (containsKeyword(lead.content)) {
        await sendToSlack(lead);
      } else {
        console.log("Ignoring post - does not match keywords:", lead.content);
      }
    }

    res.status(200).send("Webhook received successfully");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Error processing webhook");
  }
});

// ✅ Endpoint for Slack Interactivity (Button Clicks, etc.)
app.post("/slack/actions", async (req, res) => {
  console.log("Slack action received:", req.body);
  res.status(200).send("Action received");
});

// ✅ Manual Pull Data from Enagic AI
app.get("/pull-enagic-ai", async (req, res) => {
  try {
    if (!ENAGIC_AI_API_URL) {
      return res.status(500).send("Enagic AI API URL is missing in environment variables");
    }

    const response = await axios.get(ENAGIC_AI_API_URL);
    const leads = response.data.items || [];
    console.log("Manually pulled leads:", leads.length);

    for (const lead of leads) {
      if (containsKeyword(lead.content)) {
        await sendToSlack(lead);
      }
    }

    res.status(200).send("Manual Enagic AI pull successful");
  } catch (error) {
    console.error("Error fetching Enagic AI data:", error);
    res.status(500).send("Error fetching Enagic AI data");
  }
});

// ✅ Function to send formatted message to Slack
async function sendToSlack(lead) {
  if (!SLACK_WEBHOOK_URL) {
    console.error("SLACK_WEBHOOK_URL is missing in environment variables");
    return;
  }

  const slackMessage = {
    text: `🚀 *New Enagic Lead!*`,
    attachments: [
      {
        color: "#36a64f",
        fields: [
          { title: "🧑‍💼 Author", value: lead.authorName || "Unknown", short: true },
          { title: "📌 Content", value: lead.content || "No content provided", short: false },
          { title: "🔗 Post URL", value: `<${lead.url}|View Post>`, short: true },
          { title: "👍 Likes", value: lead.likes.toString(), short: true },
          { title: "📅 Posted At", value: lead.postedAt || "Unknown", short: true }
        ]
      }
    ]
  };

  try {
    await axios.post(SLACK_WEBHOOK_URL, slackMessage);
    console.log("Sent to Slack:", lead.content);
  } catch (error) {
    console.error("Error sending to Slack:", error);
  }
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
