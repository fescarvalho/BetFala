import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with API Key
const apiKey = process.env.GEMINI_API_KEY || '';

// Helper function to call Gemini with retry logic and fallback models
async function generateContentWithRetryAndFallback(
  genAI: GoogleGenerativeAI,
  prompt: string,
  imagePart: { inlineData: { data: string; mimeType: string } }
) {
  // We try gemini-2.5-flash, gemini-2.0-flash, and gemini-1.5-flash as fallbacks
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    let attempts = 0;
    const maxAttempts = 2; // Try each model up to 2 times

    while (attempts < maxAttempts) {
      try {
        console.log(`Tentando processar com o modelo ${modelName} (tentativa ${attempts + 1}/${maxAttempts})...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([prompt, imagePart]);
        
        // Test if result works and response can be extracted
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

        // Check if the error is transient (like 503, 429, etc)
        const isTransient = 
          err.status === 503 || 
          err.status === 429 || 
          errorMessage.includes('503') || 
          errorMessage.includes('429') || 
          errorMessage.includes('overloaded') || 
          errorMessage.includes('demand') ||
          errorMessage.includes('Unavailable');

        if (isTransient && attempts < maxAttempts) {
          const delayMs = attempts * 1500; // 1.5s delay for first retry
          console.log(`Erro temporário detectado. Aguardando ${delayMs}ms antes de tentar novamente...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          // If not transient, or we run out of attempts, try the next model
          console.log(`Prosseguindo para tentar o próximo modelo após erro no ${modelName}...`);
          break;
        }
      }
    }
  }

  throw lastError || new Error('Todos os modelos de IA falharam em processar o bilhete.');
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

    const responseText = await generateContentWithRetryAndFallback(genAI, prompt, imagePart);

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
    const errorMessage = error instanceof Error ? error.message : '';
    let friendlyMessage = 'Ocorreu um erro ao processar a imagem do bilhete.';
    
    if (
      errorMessage.includes('503') || 
      errorMessage.includes('504') || 
      errorMessage.includes('overloaded') || 
      errorMessage.includes('demand') ||
      errorMessage.includes('Unavailable')
    ) {
      friendlyMessage = 'Os servidores da IA estão sob alta demanda no momento e temporariamente indisponíveis (Erro 503). Por favor, tente enviar a imagem novamente em alguns instantes.';
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
