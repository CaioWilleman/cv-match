import pdfParse from "pdf-parse/lib/pdf-parse.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function lerBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Method not allowed" });
  }

  try {
    const buffer = await lerBody(req);
    const dados = await pdfParse(buffer);
    return res.status(200).json({ texto: dados.text });
  } catch (e) {
    return res.status(500).json({ erro: "Erro ao processar PDF: " + e.message });
  }
}