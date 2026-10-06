import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/quote", async (req, res) => {
  const symbol = String(req.query.symbol || "").trim().toUpperCase();
  if (!symbol) return res.status(400).json({ error: "Missing symbol." });
  if (!process.env.TWELVE_DATA_API_KEY) {
    return res.status(500).json({ error: "TWELVE_DATA_API_KEY is not configured on the server." });
  }

  try {
    const url = new URL("https://api.twelvedata.com/quote");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("apikey", process.env.TWELVE_DATA_API_KEY);

    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok || data.status === "error") {
      return res.status(502).json({ error: data.message || "Quote provider error." });
    }

    res.json({
      symbol: data.symbol || symbol,
      name: data.name || symbol,
      price: Number(data.close ?? data.price),
      previousClose: Number(data.previous_close),
      change: Number(data.change),
      percentChange: Number(data.percent_change),
      currency: data.currency || "USD",
      exchange: data.exchange || ""
    });
  } catch (e) {
    res.status(500).json({ error: "Unable to retrieve quote." });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, providerConfigured: Boolean(process.env.TWELVE_DATA_API_KEY) });
});

app.listen(PORT, () => {
  console.log(`Portfolio Tracker running at http://localhost:${PORT}`);
});
