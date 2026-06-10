import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchUpcomingOdds } from '@/services/oddsService';
import { generateContentWithRetryAndFallback } from '@/lib/gemini';

const apiKey = process.env.GEMINI_API_KEY || '';
const CRON_SECRET = process.env.CRON_SECRET || '';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      // Treat silently in case of unauthorized as per "Trate erros silenciosamente"
      return NextResponse.json({ success: false });
    }

    if (!apiKey) {
      return NextResponse.json({ success: false });
    }

    // Step A: History summary global
    const { data: apostas } = await supabase
      .from('apostas')
      .select('odd')
      .eq('status', 'Ganha');

    let historySummary = 'Apostas com bom custo-benefício e valor (odds entre 1.50 e 2.50).';
    if (apostas && apostas.length > 0) {
      const oddMedia = apostas.reduce((acc, a) => acc + Number(a.odd), 0) / apostas.length;
      historySummary = `Os usuários têm preferência por odds em torno de ${oddMedia.toFixed(2)}. Sugira apostas baseadas nesse perfil de risco/retorno.`;
    }

    // Step B: Fetch odds
    const oddsData = await fetchUpcomingOdds();
    if (!oddsData || oddsData.length === 0) {
      return NextResponse.json({ success: true, message: 'Sem dados' });
    }

    const getBrasiliaDate = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      } catch (e) {
        return '';
      }
    };
    const todayBrasilia = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    
    const todayOddsData = oddsData
      .filter((game) => getBrasiliaDate(game.commence_time) === todayBrasilia)
      .slice(0, 35); // Limite de jogos para evitar payload gigante

    const numInsights = 3;
    const genAI = new GoogleGenerativeAI(apiKey);

    const systemPrompt = `Você é um analista especialista em apostas esportivas.
Sua missão é analisar os dados de jogos disponíveis hoje e fornecer sugestões de apostas.
É OBRIGATÓRIO retornar EXATAMENTE ${numInsights} oportunidades, buscando as melhores opções de custo-benefício ou maior probabilidade de acerto dentre as disponíveis, mesmo que não sejam apostas de valor perfeitas.
Perfil do usuário: ${historySummary}
Jogos, Mercados e Odds Disponíveis:
${JSON.stringify(todayOddsData, null, 2)}

Critérios OBRIGATÓRIOS de Análise:
1. QUANTIDADE EXATA: Você DEVE gerar e retornar EXATAMENTE ${numInsights} insights. Se houver poucas opções perfeitas, escolha as melhores disponíveis (maior probabilidade de acerto ou segurança).
2. Escopo Amplo: Busque opções em Mercados Tradicionais e Mercados de Jogadores/Props.
3. Variedade Exigida: NÃO repita o mesmo confronto.
4. Indicação da Casa de Aposta: Identifique nos dados qual plataforma (bookmaker) oferece a odd sugerida.
5. Precisão: Use estritamente as odds e jogos listados nos dados fornecidos. Não invente dados.
6. Horário: Extraia do campo "commence_time" e converta para o horário de Brasília (HH:MM - DD/MM).

Formato de Saída (Exclusivo):
Retorne EXCLUSIVAMENTE um objeto JSON válido, sem texto adicional ou marcação markdown (não use \`\`\`json). Formato:
{
  "insights": [
    {
      "jogo": "Time A vs Time B",
      "mercado": "Nome do Mercado",
      "selecao": "Sua escolha específica",
      "odd": 2.15,
      "casa": "Nome da Casa",
      "horario": "21:30 - 03/06",
      "justificativa": "Análise técnica (máx 3 frases)."
    }
  ]
}`;

    const responseText = await generateContentWithRetryAndFallback(genAI, systemPrompt);
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    let insightsResult;
    try {
      insightsResult = JSON.parse(cleanedText);
    } catch {
      return NextResponse.json({ success: false });
    }

    if (insightsResult && insightsResult.insights) {
      await supabase.from('ai_insights').delete().neq('id', 0);
      
      await supabase.from('ai_insights').insert({
        data: insightsResult,
        created_at: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ success: false });
  }
}
