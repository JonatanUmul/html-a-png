import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import chromium from "chrome-aws-lambda";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

app.get("/health", async (_, res) => {
  try {
    res.json({
      ok: true,
      headless: chromium.headless,
      execPath: await chromium.executablePath // debe ser string en Render si todo está ok
    });
  } catch {
    res.json({ ok: true, headless: chromium.headless, execPath: null });
  }
});

app.post("/render-image", async (req, res) => {
  const { html, selector = ".sheet", width = 1024, scale = 2 } = req.body || {};
  if (!html || typeof html !== "string") {
    return res.status(400).json({ ok: false, error: "html requerido" });
  }

  let browser;
  try {
    const execPath = await chromium.executablePath;
    browser = await chromium.puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: execPath,
      headless: chromium.headless,
      defaultViewport: { width, height: 800, deviceScaleFactor: scale }
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

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
