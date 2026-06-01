import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper function to call Gemini with retry logic
export async function generateContentWithRetryAndFallback(
  genAI: GoogleGenerativeAI,
  prompt: string,
  imagePart?: { inlineData: { data: string; mimeType: string } }
) {
  const modelName = 'gemini-2.5-flash';
  let lastError: any = null;
  let attempts = 0;
  const maxAttempts = 4;

  while (attempts < maxAttempts) {
    try {
      console.log(`Tentando processar com o modelo ${modelName} (tentativa ${attempts + 1}/${maxAttempts})...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const parts: any[] = [prompt];
      if (imagePart) parts.push(imagePart);

      const result = await model.generateContent(parts);
      
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

      const isTransient = 
        err.status === 503 || 
        err.status === 429 || 
        errorMessage.includes('503') || 
        errorMessage.includes('429') || 
        errorMessage.includes('overloaded') || 
        errorMessage.includes('demand') ||
        errorMessage.includes('Unavailable');

      if (isTransient && attempts < maxAttempts) {
        const delayMs = attempts * 1000;
        console.log(`Erro temporário detectado. Aguardando ${delayMs}ms antes de tentar novamente...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        break;
      }
    }
  }

  throw lastError || new Error('O modelo de IA falhou em processar após várias tentativas.');
}
