import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

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
    const uint8 = new Uint8Array(buffer);
    const pdf = await getDocument({ data: uint8 }).promise;

    let texto = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const pagina = await pdf.getPage(i);
      const conteudo = await pagina.getTextContent();
      texto += conteudo.items.map((item) => item.str).join(" ") + "\n";
    }

    return res.status(200).json({ texto });
  } catch (e) {
    return res.status(500).json({ erro: "Erro ao processar PDF: " + e.message });
  }
}