import { useState, useRef } from "react";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const PROMPT = (curriculo, vaga) => `Você é um especialista em recrutamento tech e ATS (Applicant Tracking System).

Analise o currículo abaixo em relação à vaga e retorne APENAS um JSON válido, sem markdown, sem texto antes ou depois.

CURRÍCULO:
${curriculo}

VAGA:
${vaga}

Retorne exatamente neste formato:
{
  "score": <número de 0 a 100>,
  "resumo": "<uma frase direta resumindo a compatibilidade>",
  "pontos_fortes": [
    "<ponto forte 1>",
    "<ponto forte 2>",
    "<ponto forte 3>"
  ],
  "lacunas": [
    "<lacuna 1>",
    "<lacuna 2>",
    "<lacuna 3>"
  ],
  "reescritas": [
    {
      "original": "<trecho original do currículo>",
      "novo": "<versão otimizada pro ATS e pra vaga>"
    },
    {
      "original": "<trecho original>",
      "novo": "<versão otimizada>"
    }
  ],
  "dica_final": "<uma dica direta e específica pra essa candidatura>"
}

Seja direto, técnico e honesto. Não seja genérico.`;

async function extrairTextoPDF(arquivo) {
  const buffer = await arquivo.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let texto = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const pagina = await pdf.getPage(i);
    const conteudo = await pagina.getTextContent();
    texto += conteudo.items.map((item) => item.str).join(" ") + "\n";
  }
  return texto;
}

async function extrairTextoDOCX(arquivo) {
  const buffer = await arquivo.arrayBuffer();
  const resultado = await mammoth.extractRawText({ arrayBuffer: buffer });
  return resultado.value;
}

function UploadCurriculo({ onTexto, textoAtual }) {
  const inputRef = useRef(null);
  const [nomeArquivo, setNomeArquivo] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState(null);

  async function handleArquivo(e) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    setProcessando(true);
    setErro(null);
    setNomeArquivo(arquivo.name);

    try {
      let texto = "";
      if (arquivo.type === "application/pdf" || arquivo.name.endsWith(".pdf")) {
        texto = await extrairTextoPDF(arquivo);
      } else if (
        arquivo.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        arquivo.name.endsWith(".docx")
      ) {
        texto = await extrairTextoDOCX(arquivo);
      } else {
        setErro("Formato não suportado. Use PDF ou DOCX.");
        setProcessando(false);
        return;
      }
      onTexto(texto);
    } catch {
      setErro("Erro ao ler o arquivo. Tenta de novo.");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="campo">
      <label className="campo__label">
        <span>01</span> SEU CURRÍCULO
      </label>

      <div
        className={`upload-area ${nomeArquivo ? "upload-area--ativo" : ""}`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          style={{ display: "none" }}
          onChange={handleArquivo}
        />

        {processando ? (
          <span className="upload-status">Lendo arquivo...</span>
        ) : nomeArquivo ? (
          <div className="upload-sucesso">
            <span className="upload-icone">✓</span>
            <span className="upload-nome">{nomeArquivo}</span>
            <span className="upload-troca">Clique para trocar</span>
          </div>
        ) : (
          <div className="upload-vazio">
            <span className="upload-icone-vazio">↑</span>
            <span className="upload-label">Clique para subir PDF ou DOCX</span>
            <span className="upload-sub">Arraste ou clique aqui</span>
          </div>
        )}
      </div>

      {erro && <span className="campo__erro">{erro}</span>}


    </div>
  );
}

function ScoreCard({ score, resumo }) {
  const nivel = score >= 70 ? "alto" : score >= 40 ? "medio" : "baixo";
  const emoji = score >= 70 ? "🟢" : score >= 40 ? "🟡" : "🔴";

  return (
    <div className="score-card">
      <div className={`score-numero score-numero--${nivel}`}>{score}</div>
      <div className="score-info">
        <div className="score-titulo">{emoji} Compatibilidade com a vaga</div>
        <div className="score-resumo">{resumo}</div>
        <div className="score-barra-fundo">
          <div
            className={`score-barra score-barra--${nivel}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function SecaoLista({ titulo, itens, cor, icone }) {
  return (
    <div className="secao-card">
      <div className={`secao-card__header secao-card__header--${cor}`}>
        {icone} {titulo}
      </div>
      <div className="secao-card__corpo">
        {itens.map((item, i) => (
          <div key={i} className="item-lista">
            <span className="item-lista__icone">
              {cor === "verde" ? "✓" : cor === "vermelho" ? "✗" : "→"}
            </span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecaoReescrita({ reescritas }) {
  return (
    <div className="secao-card">
      <div className="secao-card__header secao-card__header--azul">
        ✦ SUGESTÕES DE REESCRITA PARA ATS
      </div>
      <div className="secao-card__corpo">
        {reescritas.map((r, i) => (
          <div key={i} className="reescrita-bloco">
            <div className="reescrita-original">{r.original}</div>
            <div className="reescrita-novo">{r.novo}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecaoDica({ dica }) {
  return (
    <div className="secao-card">
      <div className="secao-card__header secao-card__header--amarelo">
        ⚡ DICA FINAL
      </div>
      <div className="secao-card__corpo">
        <div className="item-lista">
          <span>{dica}</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [curriculo, setCurriculo] = useState("");
  const [vaga, setVaga] = useState("");
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const podeanalisar = curriculo.trim().length > 50 && vaga.trim().length > 20;

  async function analisar() {
    setCarregando(true);
    setErro(null);
    setResultado(null);

    try {
      const resposta = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: PROMPT(curriculo, vaga) }],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });

      const dados = await resposta.json();
      const texto = dados.choices[0].message.content;
      const limpo = texto.replace(/```json|```/g, "").trim();
      const json = JSON.parse(limpo);
      setResultado(json);
    } catch {
      setErro("Erro na análise. Verifica se os campos estão preenchidos e tenta de novo.");
    } finally {
      setCarregando(false);
    }
  }

  function reiniciar() {
    setCurriculo("");
    setVaga("");
    setResultado(null);
    setErro(null);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header__top">
          <div className="header__logo">cv-match</div>
          <span className="header__versao">v1.0</span>
        </div>
        <div className="header__desc">
          Suba seu currículo e cole a vaga — a IA analisa a compatibilidade e sugere melhorias.
        </div>
      </header>

      {!resultado ? (
        <>
          <div className="inputs-grid">
            <UploadCurriculo onTexto={setCurriculo} textoAtual={curriculo} />

            <div className="campo">
              <label className="campo__label">
                <span>02</span> DESCRIÇÃO DA VAGA
              </label>
              <textarea
                className="campo__textarea"
                placeholder="Cole aqui a descrição completa da vaga..."
                value={vaga}
                onChange={(e) => setVaga(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn-analisar"
            onClick={analisar}
            disabled={!podeanalisar || carregando}
          >
            {carregando ? "Analisando..." : "→ Analisar compatibilidade"}
          </button>

          {carregando && (
            <div className="loading">
              <div className="loading__dot" />
              <div className="loading__dot" />
              <div className="loading__dot" />
              <span>analisando currículo...</span>
            </div>
          )}

          {erro && <div className="erro">{erro}</div>}
        </>
      ) : (
        <div className="resultado">
          <ScoreCard score={resultado.score} resumo={resultado.resumo} />
          <SecaoLista titulo="PONTOS FORTES" itens={resultado.pontos_fortes} cor="verde" icone="✓" />
          <SecaoLista titulo="LACUNAS IDENTIFICADAS" itens={resultado.lacunas} cor="vermelho" icone="✗" />
          {resultado.reescritas?.length > 0 && <SecaoReescrita reescritas={resultado.reescritas} />}
          <SecaoDica dica={resultado.dica_final} />
          <button className="btn-nova" onClick={reiniciar}>← Nova análise</button>
        </div>
      )}
    </div>
  );
}