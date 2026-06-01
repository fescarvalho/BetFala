import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchUpcomingOdds } from '@/services/oddsService';
import { generateContentWithRetryAndFallback } from '@/lib/gemini';

const apiKey = process.env.GEMINI_API_KEY || '';

export async function GET(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY não configurada' }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const forceRefresh = req.nextUrl.searchParams.get('refresh') === 'true';

    // Verificar se já existe insight gerado hoje (a menos que seja refresh forçado)
    if (!forceRefresh) {
      const { data: existingInsight } = await supabase
        .from('daily_insights')
        .select('insight_data')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lte('created_at', `${today}T23:59:59.999Z`)
        .single();

      if (existingInsight && existingInsight.insight_data) {
        // Só usa o cache se tiver pelo menos 10 insights e o primeiro tiver o campo horario
        const insights = existingInsight.insight_data?.insights;
        const isValidCache = Array.isArray(insights) && insights.length >= 10 && insights[0].horario;
        if (isValidCache) {
          return NextResponse.json(existingInsight.insight_data);
        }
      }
    }

    // Passo A: Buscar histórico de apostas
    const { data: apostas } = await supabase
      .from('apostas')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'Ganha');

    let historySummary = 'Usuário novo ou sem histórico de ganhos suficiente. Sugira apostas com bom custo-benefício e valor (odds entre 1.50 e 2.50).';
    if (apostas && apostas.length > 0) {
      const oddMedia = apostas.reduce((acc, a) => acc + Number(a.odd), 0) / apostas.length;
      historySummary = `O usuário tem preferência por odds em torno de ${oddMedia.toFixed(2)}. Sugira apostas baseadas nesse perfil de risco/retorno.`;
    }

    // Passo B: Fetch das odds do dia
    const oddsData = await fetchUpcomingOdds();

    if (!oddsData || oddsData.length === 0) {
      return NextResponse.json({ insights: [] });
    }

    // Passo C: Construir o prompt
    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = `Você é um especialista em apostas esportivas com foco em Futebol e NBA.
Analise os seguintes jogos de Futebol (Brasileirão, Champions League, Premier League) e NBA disponíveis, e sugira as 10 melhores apostas de valor para o usuário, levando em conta seu perfil.

Perfil do usuário: ${historySummary}

Jogos e Odds Disponíveis (formato decimal):
${JSON.stringify(oddsData, null, 2)}

INSTRUÇÕES IMPORTANTES:
- Analise APENAS jogos de Futebol e NBA. Ignore qualquer outro esporte.
- Não invente dados, times, odds ou mercados que não estão listados acima.
- Selecione 10 oportunidades que representem as melhores apostas matemáticas de acordo com as odds apresentadas.
- Retorne EXCLUSIVAMENTE um objeto JSON válido, sem NENHUM texto adicional ou marcação markdown (não use \`\`\`json).
- O campo "horario" deve ser extraído do campo "commence_time" do jogo (converta para o horário de Brasília, formato "HH:MM - DD/MM").
- O formato obrigatório do JSON é:
{
  "insights": [
    {
      "jogo": "Time A vs Time B",
      "mercado": "Vencedor da Partida - Time A",
      "odd": 1.85,
      "horario": "21:00 - 01/06",
      "justificativa": "Motivo curto, claro e analítico da escolha baseado nas odds apresentadas."
    }
  ]
}`;

    // Passo D: Chamar Gemini com fallback
    const responseText = await generateContentWithRetryAndFallback(genAI, prompt);
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    let insightsResult;
    try {
      insightsResult = JSON.parse(cleanedText);
    } catch {
      console.error('Falha ao fazer parse do retorno da IA:', cleanedText);
      throw new Error('Falha ao interpretar os dados da IA.');
    }

    // Salvar no banco de forma silenciosa para não quebrar o fluxo se falhar
    supabase.from('daily_insights').insert({
      user_id: user.id,
      insight_data: insightsResult,
      created_at: new Date().toISOString()
    }).then(({ error }) => {
      if (error) console.error('Erro ao salvar daily_insight:', error);
    });

    return NextResponse.json(insightsResult);

  } catch (error) {
    console.error('Erro na rota de insights:', error);
    // Erros tratados silenciosamente na view
    return NextResponse.json(
      { error: 'Não foi possível gerar os insights neste momento.', insights: [] },
      { status: 200 } // Retorna 200 com array vazio para falhar graciosamente no frontend
    );
  }
}
