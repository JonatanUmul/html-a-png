import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import puppeteer from "puppeteer";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

app.post("/html-to-image", async (req, res) => {
  const { html } = req.body;

  if (!html) {
    return res.status(400).json({ error: "HTML no proporcionado" });
  }

  try {
   const browser = await puppeteer.launch({
  headless: "new",  // importante en Node >= 18
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--no-zygote",
    "--single-process"
  ]
});


    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const screenshot = await page.screenshot({ type: "png", fullPage: true });

    await browser.close();

    res.json({
      image: `data:image/png;base64,${screenshot.toString("base64")}`,
    });
  } catch (error) {
    console.error(" Error generando la imagen:", error);
    res.status(500).json({ error: "Error generando la imagen" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Microservicio corriendo en puerto ${PORT}`));
