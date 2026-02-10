const express = require("express");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();
const app = express();
app.use(express.json());

const EMAIL = process.env.OFFICIAL_EMAIL;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

const fibonacci = (n) => {
  const arr = [];
  let a = 0, b = 1;
  for (let i = 0; i < n; i++) {
    arr.push(a);
    [a, b] = [b, a + b];
  }
  return arr;
};

const isPrime = (num) => {
  if (num < 2) return false;
  for (let i = 2; i * i <= num; i++) {
    if (num % i === 0) return false;
  }
  return true;
};

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const hcf = (arr) => arr.reduce((a, b) => gcd(a, b));
const lcm = (arr) => arr.reduce((a, b) => (a * b) / gcd(a, b));

app.get("/health", (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: EMAIL
  });
});

app.post("/bfhl", async (req, res) => {
  try {
    const body = req.body;
    const keys = Object.keys(body);

    if (keys.length !== 1) {
      return res.status(400).json({
        is_success: false,
        error: "Request must contain exactly one key"
      });
    }

    const key = keys[0];
    let data;

    switch (key) {
      case "fibonacci":
        if (!Number.isInteger(body[key]) || body[key] < 0) {
          throw new Error("Invalid fibonacci input");
        }
        data = fibonacci(body[key]);
        break;

      case "prime":
        if (!Array.isArray(body[key])) {
          throw new Error("Invalid prime input");
        }
        data = body[key].filter(isPrime);
        break;

      case "lcm":
        if (!Array.isArray(body[key])) {
          throw new Error("Invalid lcm input");
        }
        data = lcm(body[key]);
        break;

      case "hcf":
        if (!Array.isArray(body[key])) {
          throw new Error("Invalid hcf input");
        }
        data = hcf(body[key]);
        break;

      case "AI":
        if (typeof body[key] !== "string") {
          throw new Error("Invalid AI input");
        }

        const aiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: `Answer in ONE WORD only:\n${body[key]}`
                  }
                ]
              }
            ]
          }
        );

        data =
          aiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "UNKNOWN";

        break;

      default:
        return res.status(400).json({
          is_success: false,
          error: "Invalid key"
        });
    }

    res.status(200).json({
      is_success: true,
      official_email: EMAIL,
      data
    });

  } catch (err) {
    res.status(400).json({
      is_success: false,
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
