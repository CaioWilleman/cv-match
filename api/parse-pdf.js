const pdfParse = require("pdf-parse");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Method not allowed" });
  }

  try {
    const chunks = [];
    await new Promise((resolve, reject) => {
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", resolve);
      req.on("error", reject);
    });

    const buffer = Buffer.concat(chunks);
    const dados = await pdfParse(buffer);
    return res.status(200).json({ texto: dados.text });
  } catch (e) {
    return res.status(500).json({ erro: "Erro: " + e.message });
  }
};