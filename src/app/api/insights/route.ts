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
        // Só usa o cache se o primeiro insight tiver os campos horario e selecao (novo formato)
        const insights = existingInsight.insight_data?.insights;
        const isValidCache = Array.isArray(insights) && (insights.length === 0 || (insights[0].horario && insights[0].selecao));
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

    // Filtrar apenas jogos do dia atual (no fuso horário de Brasília)
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
      .slice(0, 25);

    if (todayOddsData.length === 0) {
      return NextResponse.json({ insights: [] });
    }

    // Limita o número de insights ao máximo de jogos disponíveis hoje, no máximo 10
    const numInsights = Math.min(10, todayOddsData.length);

    // Passo C: Construir o prompt
    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = `Você é um analista de apostas esportivas focado em valor (EV+).
Analise os dados de jogos de Futebol (Brasileirão, Champions League, Premier League, Serie A, La Liga, Ligue 1, Bundesliga, Copa do Mundo 2026, Amistosos Internacionais) e NBA disponíveis hoje.
Cruze com o perfil do usuário para sugerir até \${numInsights} oportunidades.

Perfil do usuário: \${historySummary}

Jogos, Mercados e Odds Disponíveis:
\${JSON.stringify(todayOddsData, null, 2)}

Sua Tarefa:
1. Sugira até \${numInsights} apostas de valor (EV+), buscando anomalias em Mercados Tradicionais (Vencedor, Handicaps) ou Props de Jogadores.
2. Não repita confrontos (máximo 1 insight por jogo). Se não houver \${numInsights} boas opções nos dados, retorne menos, não há problema.
3. Indique a casa de aposta (bookmaker) correspondente.
4. Horário: Extraia do campo "commence_time" (formato de Brasília: HH:MM - DD/MM).
5. Use apenas os dados fornecidos.

Responda APENAS com um objeto JSON válido, sem marcações markdown ou texto extra. Formato:
{
  "insights": [
    {
      "jogo": "Time A vs Time B",
      "mercado": "Nome do Mercado",
      "selecao": "Sua escolha",
      "odd": 2.15,
      "casa": "Nome da Casa",
      "horario": "21:30 - 03/06",
      "justificativa": "Análise técnica (máx 3 frases)."
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
