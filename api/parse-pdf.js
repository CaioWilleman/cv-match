import PDFParser from "pdf2json";

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

    const texto = await new Promise((resolve, reject) => {
      const parser = new PDFParser();
      parser.on("pdfParser_dataReady", (data) => {
        const texto = data.Pages.map((page) =>
          page.Texts.map((t) => decodeURIComponent(t.R.map((r) => r.T).join(""))).join(" ")
        ).join("\n");
        resolve(texto);
      });
      parser.on("pdfParser_dataError", reject);
      parser.parseBuffer(buffer);
    });

    return res.status(200).json({ texto });
  } catch (e) {
    return res.status(500).json({ erro: "Erro: " + e.message });
  }
}