import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { chromium } from "playwright";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

app.get("/health", (_, res) => res.json({ ok: true }));

app.post("/render-image", async (req, res) => {
  const { html, selector = ".sheet", width = 1024, scale = 2 } = req.body || {};
  if (!html || typeof html !== "string") {
    return res.status(400).json({ ok: false, error: "html requerido" });
  }

  let browser;
  try {
    browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true
    });

    const context = await browser.newContext({
      viewport: { width, height: 800, deviceScaleFactor: scale }
    });

    const page = await context.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });

    const el = await page.$(selector);
    const buffer = el
      ? await el.screenshot({ type: "png" })
      : await page.screenshot({ type: "png", fullPage: true });

    res.json({ ok: true, pngBase64: buffer.toString("base64") });
  } catch (err) {
    console.error("Error en render:", err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servicio HTML→PNG listo en :${PORT}`));
