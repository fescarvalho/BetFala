import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with API Key
const apiKey = process.env.GEMINI_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'A chave da API do Gemini (GEMINI_API_KEY) não está configurada no .env.local' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: 'Nenhuma imagem fornecida.' }, { status: 400 });
    }

    // image is expected to be a base64 string starting with "data:image/png;base64,..."
    const base64Data = image.split(',')[1] || image;

    // Determine mime type if present in the data URI
    let mimeType = 'image/png';
    const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    if (matches && matches.length > 1) {
      mimeType = matches[1];
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash as it is fast and supports multimodality
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Você é um assistente especializado em extrair dados de bilhetes e prints de apostas esportivas.
Analise a imagem enviada, que é um print de uma aposta (ex: bet365, betano, superbet, etc).
Extraia os seguintes campos e retorne APENAS um objeto JSON válido, sem markdown (\`\`\`json), contendo:
{
  "times_apostados": "Nome do evento ou times jogando (ex: Flamengo vs Vasco). Se for múltipla, resuma (ex: Múltipla - 5 Jogos)",
  "detalhe_aposta": "O mercado ou palpite (ex: Resultado Final - Flamengo). Se for múltipla, escreva 'Múltipla' ou 'Criar Aposta'",
  "odd": "Valor numérico da odd (ex: 1.85). Se for uma aposta múltipla e a odd total não estiver visível na imagem, CALCULE a odd total multiplicando todas as odds individuais visíveis no bilhete. Use ponto para decimal. Deixe vazio se não encontrar.",
  "stake": "Valor numérico apostado. Procure na imagem por termos como 'Valor Apostado', 'Aposta', 'Total Stake' ou o valor financeiro investido (ex: R$ 50,00). Retorne APENAS O NÚMERO (ex: 50.00), usando ponto para decimal e removendo símbolos de moeda. Deixe vazio se não encontrar."
}
Se não tiver certeza sobre algum valor, deixe como string vazia.
Retorne apenas o JSON. Não adicione nenhum texto antes ou depois.`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = await result.response.text();

    // Limpar markdown de json se o Gemini retornar com formatação
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch {
      console.error('Failed to parse Gemini output:', cleanedText);
      return NextResponse.json({ error: 'Erro ao interpretar a resposta da IA.' }, { status: 500 });
    }

    return NextResponse.json(parsedData);

  } catch (error) {
    console.error('Error processing image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno ao processar a imagem.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
