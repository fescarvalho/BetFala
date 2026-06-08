import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with API Key
const apiKey = process.env.GEMINI_API_KEY || '';

// Helper function to call Gemini with retry logic
async function generateContentWithRetryAndFallback(
  genAI: GoogleGenerativeAI,
  prompt: string,
  mediaPart: { inlineData: { data: string; mimeType: string } }
) {
  // Vamos focar no modelo principal que sabemos que existe,
  // apenas aumentando as tentativas, pois os outros retornaram 404 (não encontrados para essa API Key).
  const modelName = 'gemini-2.5-flash';
  let lastError: any = null;
  let attempts = 0;
  const maxAttempts = 4; // Tentamos até 4 vezes com backoff

  while (attempts < maxAttempts) {
    try {
      console.log(`Tentando processar com o modelo ${modelName} (tentativa ${attempts + 1}/${maxAttempts})...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([prompt, mediaPart]);
      
      const text = await result.response.text();
      if (text) {
        console.log(`Sucesso com o modelo ${modelName}!`);
        return text;
      }
    } catch (err: any) {
      attempts++;
      lastError = err;
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn(`Erro com o modelo ${modelName} na tentativa ${attempts}:`, errorMessage);

      // Verifica se o erro é de instabilidade/sobrecarga
      const isTransient = 
        err.status === 503 || 
        err.status === 429 || 
        errorMessage.includes('503') || 
        errorMessage.includes('429') || 
        errorMessage.includes('overloaded') || 
        errorMessage.includes('demand') ||
        errorMessage.includes('Unavailable');

      if (isTransient && attempts < maxAttempts) {
        // Backoff: 1s, 2s, 3s...
        const delayMs = attempts * 1000;
        console.log(`Erro temporário detectado. Aguardando ${delayMs}ms antes de tentar novamente...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        // Se for 404 ou erro fatal, ou esgotarem as tentativas, paramos.
        break;
      }
    }
  }

  throw lastError || new Error('O modelo de IA falhou em processar a mídia após várias tentativas.');
}

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'A chave da API do Gemini (GEMINI_API_KEY) não está configurada no .env.local' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { image, audio } = body;
    const media = image || audio;

    if (!media) {
      return NextResponse.json({ error: 'Nenhuma mídia fornecida (imagem ou áudio).' }, { status: 400 });
    }

    // media is expected to be a base64 string starting with "data:..."
    const base64Data = media.split(',')[1] || media;

    // Determine mime type if present in the data URI
    let mimeType = image ? 'image/png' : 'audio/webm';
    const matches = media.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    if (matches && matches.length > 1) {
      mimeType = matches[1];
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `Você é um assistente especializado em extrair dados de apostas esportivas a partir de imagens (prints) ou áudios transcritos implicitamente.
Analise a mídia enviada.
Extraia os seguintes campos e retorne APENAS um objeto JSON válido, sem markdown (\`\`\`json), contendo:
{
  "times_apostados": "Nome do evento ou times jogando (ex: Flamengo vs Vasco). Se for múltipla, resuma (ex: Múltipla - 5 Jogos)",
  "detalhe_aposta": "O mercado ou palpite (ex: Resultado Final - Flamengo). Se for múltipla, escreva 'Múltipla' ou 'Criar Aposta'",
  "odd": "Valor numérico da odd (ex: 1.85). Se for uma aposta múltipla e a odd total não estiver visível, CALCULE a odd total multiplicando todas as odds individuais visíveis. Use ponto para decimal. Deixe vazio se não encontrar.",
  "stake": "Valor numérico apostado. Procure por termos como 'Valor Apostado', 'Aposta', ou o valor financeiro (ex: R$ 50,00). Retorne APENAS O NÚMERO (ex: 50.00), usando ponto para decimal. Deixe vazio se não encontrar.",
  "status": "Identifique se a mídia indica que a aposta já foi resolvida. OBRIGATORIAMENTE um destes valores: 'Aberta', 'Green', 'Red', 'Cashout' ou 'Devolvida'. Se não houver indicação, use 'Aberta'.",
  "valor_retorno": 75.50 // Retorne o valor ganho em número decimal se o status for 'Cashout', 'Green' ou 'Devolvida'. Caso contrário, retorne null.
}
Se não tiver certeza sobre algum valor (exceto status), deixe como string vazia.
Retorne apenas o JSON. Não adicione nenhum texto antes ou depois.`;

    const mediaPart = {
      inlineData: {
        data: base64Data,
        mimeType
      },
    };

    const responseText = await generateContentWithRetryAndFallback(genAI, prompt, mediaPart);

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
    console.error('Error processing media:', error);
    const errorMessage = error instanceof Error ? error.message : '';
    let friendlyMessage = 'Ocorreu um erro ao processar a mídia.';
    
    if (
      errorMessage.includes('503') || 
      errorMessage.includes('504') || 
      errorMessage.includes('overloaded') || 
      errorMessage.includes('demand') ||
      errorMessage.includes('Unavailable')
    ) {
      friendlyMessage = 'Os servidores da IA estão sob alta demanda no momento e temporariamente indisponíveis (Erro 503). Por favor, tente enviar novamente em alguns instantes.';
    } else if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      friendlyMessage = 'Limite de requisições excedido da IA. Por favor, aguarde um momento e tente novamente.';
    } else if (errorMessage.includes('API key') || errorMessage.includes('API_KEY')) {
      friendlyMessage = 'Erro de configuração na chave da API do Gemini. Verifique as configurações.';
    } else if (errorMessage) {
      friendlyMessage = `Erro na IA: ${errorMessage.substring(0, 150)}`;
    }

    return NextResponse.json(
      { error: friendlyMessage },
      { status: 500 }
    );
  }
}
