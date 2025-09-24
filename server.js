const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json({ limit: "10mb" })); // para HTML largos

app.post("/html-to-image", async (req, res) => {
  const { html } = req.body;

  if (!html) {
    return res.status(400).json({ error: "HTML no proporcionado" });
  }

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const screenshot = await page.screenshot({ type: "png", fullPage: true });

    await browser.close();

    // Responder en base64
    res.json({
      image: `data:image/png;base64,${screenshot.toString("base64")}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generando la imagen" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Microservicio corriendo en puerto ${PORT}`));
