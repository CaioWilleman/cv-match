import { createRequire } from "module";
const require = createRequire(import.meta.url);

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
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
    const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";

    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    let texto = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const pagina = await pdf.getPage(i);
      const conteudo = await pagina.getTextContent();
      texto += conteudo.items.map((item) => item.str).join(" ") + "\n";
    }

    return res.status(200).json({ texto });
  } catch (e) {
    return res.status(500).json({ erro: "Erro: " + e.message });
  }
}