import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================================
// Tipos Telegram
// ============================================================
interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

interface TelegramMessage {
  message_id: number;
  from?: { id: number; first_name: string; username?: string };
  chat: { id: number };
  text?: string;
  photo?: TelegramPhotoSize[];
  caption?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

// ============================================================
// Tipo resultado do Gemini
// ============================================================
interface GeminiApostaResult {
  tipo_aposta?: 'Simples' | 'Multipla';
  casa?: string;
  odd_total?: number;
  valor_apostado?: number;
  valor_retorno?: number | null;
  status?: string;
  selecoes?: {
    jogo: string;
    mercado: string;
    selecao: string;
    odd_selecao: number;
  }[];
}

// ============================================================
// Helpers
// ============================================================
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const GEMINI_KEY = process.env.GEMINI_API_KEY ?? '';
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? '';

async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

async function downloadPhotoAsBase64(fileId: string): Promise<{ data: string; mimeType: string }> {
  // 1. Obter path do arquivo
  const fileRes = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`
  );
  const fileJson = await fileRes.json();
  const filePath: string = fileJson.result?.file_path;

  if (!filePath) throw new Error('Não foi possível obter o caminho do arquivo no Telegram.');

  // 2. Download do arquivo em bytes
  const photoRes = await fetch(
    `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`
  );
  const arrayBuffer = await photoRes.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  const ext = filePath.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  return { data: base64, mimeType };
}

async function analyzeWithGemini(
  base64Data: string,
  mimeType: string,
  textInput?: string
): Promise<GeminiApostaResult> {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Você analisará prints de bilhetes de apostas. Identifique primeiro se é uma aposta SIMPLES ou MÚLTIPLA. Retorne um JSON com a seguinte estrutura estrita:
{
  "tipo_aposta": "'Simples' ou 'Multipla'",
  "casa": "Nome da casa de aposta",
  "odd_total": A odd final multiplicada (número),
  "valor_apostado": O valor financeiro investido na aposta (Stake) (número),
  "valor_retorno": O valor financeiro retornado (se for Green ou Cashout, caso contrário null),
  "status": "'Aberta', 'Green', 'Red', 'Cashout' ou 'Devolvida'",
  "selecoes": [
    {
      "jogo": "Nome do jogo",
      "mercado": "Mercado da aposta",
      "selecao": "Seleção (ex: Vitória do Bahia)",
      "odd_selecao": Odd da seleção (número)
    }
  ]
}
Retorne apenas o JSON. Nenhum texto antes ou depois. Não utilize crases de markdown.`;

  const parts: (string | { inlineData: { data: string; mimeType: string } })[] = [prompt];

  if (textInput) {
    parts.push(`\n\nTexto da aposta: ${textInput}`);
  } else {
    parts.push({ inlineData: { data: base64Data, mimeType } });
  }

  const maxAttempts = 4;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await model.generateContent(parts);
      const text = await result.response.text();
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned) as GeminiApostaResult;
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes('503') || msg.includes('429') || msg.includes('overloaded') || msg.includes('Unavailable');

      if (isTransient && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, attempt * 1200));
      } else {
        break;
      }
    }
  }

  throw lastError ?? new Error('Gemini falhou após múltiplas tentativas.');
}

function mapStatus(raw: string | undefined): 'Aberta' | 'Green' | 'Red' | 'Void' | 'Cashout' {
  const map: Record<string, 'Aberta' | 'Green' | 'Red' | 'Void' | 'Cashout'> = {
    Aberta: 'Aberta',
    Green: 'Green',
    Red: 'Red',
    Cashout: 'Cashout',
    Devolvida: 'Void',
    Void: 'Void',
  };
  return map[raw ?? ''] ?? 'Aberta';
}

// ============================================================
// POST Handler — Webhook do Telegram
// ============================================================
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Validar secret token (se configurado)
  if (WEBHOOK_SECRET) {
    const secretHeader = req.headers.get('x-telegram-bot-api-secret-token');
    if (secretHeader !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!TELEGRAM_TOKEN) {
    console.error('[Telegram Webhook] TELEGRAM_BOT_TOKEN não configurado.');
    return NextResponse.json({ ok: true }); // Retornar 200 para o Telegram não reenviar
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId = message.chat.id;
  const telegramUserId = message.from?.id;

  if (!telegramUserId) {
    return NextResponse.json({ ok: true });
  }

  // ============================================================
  // Identificar utilizador no Supabase via telegram_chat_id
  // ============================================================
  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profileRows } = await supabaseAdmin
    .from('profiles')
    .select('user_id, banca_id_padrao')
    .eq('telegram_chat_id', String(telegramUserId))
    .limit(1);

  const profile = profileRows?.[0];

  if (!profile?.user_id) {
    await sendTelegramMessage(
      chatId,
      `⚠️ Sua conta Telegram não está vinculada ao BetFala.\n\nAcesse o app e vincule seu Telegram ID nas configurações.\n\n<b>Seu ID:</b> <code>${telegramUserId}</code>`
    );
    return NextResponse.json({ ok: true });
  }

  const userId: string = profile.user_id;
  let bancaId: string | null = profile.banca_id_padrao ?? null;

  // ============================================================
  // Processar mensagem (foto ou texto)
  // ============================================================
  await sendTelegramMessage(chatId, '⏳ Analisando sua aposta...');

  let geminiResult: GeminiApostaResult;

  try {
    if (message.photo && message.photo.length > 0) {
      // Pegar a foto de maior resolução (último elemento do array)
      const bestPhoto = message.photo[message.photo.length - 1];
      const { data, mimeType } = await downloadPhotoAsBase64(bestPhoto.file_id);
      geminiResult = await analyzeWithGemini(data, mimeType, message.caption);
    } else if (message.text) {
      geminiResult = await analyzeWithGemini('', 'text/plain', message.text);
    } else {
      await sendTelegramMessage(
        chatId,
        '❌ Tipo de mensagem não suportado. Envie um print ou descrição em texto da sua aposta.'
      );
      return NextResponse.json({ ok: true });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[Telegram Webhook] Erro Gemini:', msg);
    await sendTelegramMessage(chatId, `❌ Erro ao analisar a aposta: ${msg.substring(0, 200)}`);
    return NextResponse.json({ ok: true });
  }

  // ============================================================
  // Validar dados mínimos
  // ============================================================
  const tipoAposta = geminiResult.tipo_aposta === 'Multipla' ? 'Multipla' : 'Simples';
  const odd = parseFloat(String(geminiResult.odd_total ?? '')) || 0;
  const stake = parseFloat(String(geminiResult.valor_apostado ?? '')) || 0;
  const status = mapStatus(geminiResult.status);
  const valorCashout =
    status === 'Cashout' || status === 'Green' || status === 'Void'
      ? (geminiResult.valor_retorno ?? null)
      : null;
  const selecoes = geminiResult.selecoes || [];

  if (selecoes.length === 0 || odd <= 0) {
    await sendTelegramMessage(
      chatId,
      `⚠️ Não consegui identificar os dados da aposta com clareza.\n\nTente enviar um print mais nítido ou descreva no formato:\n<i>"Apostei R$50 em Flamengo, odd 2.10"</i>`
    );
    return NextResponse.json({ ok: true });
  }

  const timesApostados = selecoes.map(s => s.jogo).join(' / ');
  const detalheAposta = tipoAposta === 'Multipla' ? 'Múltipla' : (selecoes[0]?.mercado || '');

  // ============================================================
  // Identificar Banca pelo nome
  // ============================================================
  let finalBancaNome = 'Padrão';
  if (geminiResult.casa) {
    const { data: bancasEncontradas } = await supabaseAdmin
      .from('bancas')
      .select('id, nome')
      .eq('user_id', userId)
      .ilike('nome', `%${geminiResult.casa.trim()}%`)
      .limit(1);

    if (bancasEncontradas && bancasEncontradas.length > 0) {
      bancaId = bancasEncontradas[0].id;
      finalBancaNome = bancasEncontradas[0].nome;
    } else {
      finalBancaNome = `${geminiResult.casa} (Não encontrada - Usando Padrão)`;
    }
  } else if (bancaId) {
    const { data: bancaPadrao } = await supabaseAdmin
      .from('bancas')
      .select('nome')
      .eq('id', bancaId)
      .limit(1);
    if (bancaPadrao && bancaPadrao.length > 0) {
      finalBancaNome = bancaPadrao[0].nome;
    }
  }

  // ============================================================
  // INSERT no Supabase
  // ============================================================
  const insertPayload: Record<string, unknown> = {
    user_id: userId,
    times_apostados: timesApostados,
    detalhe_aposta: detalheAposta,
    odd,
    stake,
    status,
    data_criacao: new Date().toISOString(),
    tipo_aposta: tipoAposta,
    odd_total: odd,
    valor_apostado: stake,
    detalhes_selecoes: selecoes,
    ...(bancaId ? { banca_id: bancaId } : {}),
    ...(valorCashout !== null ? { valor_cashout: valorCashout } : {}),
  };

  const { error: insertError } = await supabaseAdmin.from('apostas').insert(insertPayload);

  if (insertError) {
    console.error('[Telegram Webhook] Erro ao inserir aposta:', insertError.message);
    await sendTelegramMessage(
      chatId,
      `❌ Não foi possível salvar a aposta no banco de dados.\n\n<i>${insertError.message}</i>`
    );
    return NextResponse.json({ ok: true });
  }

  // ============================================================
  // Resposta de sucesso
  // ============================================================
  const statusEmoji: Record<string, string> = {
    Green: '🟢',
    Red: '🔴',
    Cashout: '💛',
    Void: '⚪',
    Aberta: '🔵',
  };

  const emoji = statusEmoji[status] ?? '📝';

  const successMsg =
    `✅ <b>Aposta registada com sucesso!</b>\n\n` +
    `⚽ <b>Jogos:</b> ${timesApostados}\n` +
    `🎯 <b>Tipo:</b> ${tipoAposta}\n` +
    `📊 <b>Odd Total:</b> ${odd.toFixed(2)}\n` +
    `💰 <b>Stake:</b> R$ ${stake.toFixed(2)}\n` +
    `🏦 <b>Casa:</b> ${finalBancaNome}\n` +
    `${emoji} <b>Status:</b> ${status}` +
    (valorCashout !== null ? `\n💵 <b>Retorno:</b> R$ ${Number(valorCashout).toFixed(2)}` : '');

  await sendTelegramMessage(chatId, successMsg);

  return NextResponse.json({ ok: true });
}

