const http = require("http");
const { URL } = require("url");
const twilio = require("twilio");

const PORT = Number(process.env.SMS_PORT || 3001);
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

function sendSms(to, body) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    throw new Error(
      "Missing Twilio credentials. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER.",
    );
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return client.messages.create({
    body,
    from: TWILIO_PHONE_NUMBER,
    to,
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST" || requestUrl.pathname !== "/api/send-sms") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "Not found" }));
    return;
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const raw = Buffer.concat(chunks).toString("utf-8");
    const payload = raw ? JSON.parse(raw) : {};

    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to].filter(Boolean);
    const body = payload.message || "";

    if (!recipients.length || !body) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "Missing recipients or message body" }));
      return;
    }

    const results = await Promise.all(
      recipients.map((number) => sendSms(number, body)),
    );

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        sent: results.length,
        messageIds: results.map((item) => item.sid),
      }),
    );
  } catch (error) {
    console.error("SMS send failed:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        ok: false,
        error: error.message || "Failed to send SMS",
      }),
    );
  }
});

server.listen(PORT, () => {
  console.log(`SMS backend listening on http://localhost:${PORT}`);
});
