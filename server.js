import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import puppeteer from "puppeteer";

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
   browser = await puppeteer.launch({
  headless: "new",
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--no-zygote"
  ]
});


    const page = await browser.newPage();
    await page.setViewport({ width, height: 800, deviceScaleFactor: scale });
    await page.setContent(html, { waitUntil: "networkidle0" });

    let buffer;
    const el = await page.$(selector);
    if (el) buffer = await el.screenshot({ type: "png" });
    else buffer = await page.screenshot({ type: "png", fullPage: true });

    res.json({ pngBase64: buffer.toString("base64") });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servicio HTML→PNG listo en :${PORT}`));
