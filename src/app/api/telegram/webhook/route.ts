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
  times_apostados?: string;
  detalhe_aposta?: string;
  odd?: string | number;
  stake?: string | number;
  status?: string;
  valor_retorno?: number | null;
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

  const prompt = `Você é um assistente especializado em extrair dados de apostas esportivas a partir de imagens (prints) ou descrições em texto.
Analise a mídia ou o texto enviado.
Extraia os seguintes campos e retorne APENAS um objeto JSON válido, sem markdown (\`\`\`json), contendo:
{
  "times_apostados": "Nome do evento ou times jogando (ex: Flamengo vs Vasco). Se for múltipla, resuma (ex: Múltipla - 5 Jogos)",
  "detalhe_aposta": "O mercado ou palpite (ex: Resultado Final - Flamengo). Se múltipla, escreva 'Múltipla' ou 'Criar Aposta'",
  "odd": número decimal da odd (ex: 1.85). Se múltipla e total não visível, CALCULE multiplicando as odds individuais. Null se não encontrar.,
  "stake": número decimal apostado (ex: 50.00). Null se não encontrar.,
  "status": "OBRIGATORIAMENTE um destes valores: 'Aberta', 'Green', 'Red', 'Cashout' ou 'Devolvida'. Se não indicado, use 'Aberta'.",
  "valor_retorno": número decimal se status for 'Cashout', 'Green' ou 'Devolvida'. Null caso contrário.
}
Retorne apenas o JSON. Nenhum texto antes ou depois.`;

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
  const bancaId: string | null = profile.banca_id_padrao ?? null;

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
  const timesApostados = geminiResult.times_apostados?.trim() || '';
  const detalheAposta = geminiResult.detalhe_aposta?.trim() || '';
  const odd = parseFloat(String(geminiResult.odd ?? '')) || 0;
  const stake = parseFloat(String(geminiResult.stake ?? '')) || 0;
  const status = mapStatus(geminiResult.status);
  const valorCashout =
    status === 'Cashout' || status === 'Green' || status === 'Void'
      ? (geminiResult.valor_retorno ?? null)
      : null;

  if (!timesApostados || odd <= 0) {
    await sendTelegramMessage(
      chatId,
      `⚠️ Não consegui identificar os dados da aposta com clareza.\n\nTente enviar um print mais nítido ou descreva no formato:\n<i>"Apostei R$50 em Flamengo, odd 2.10"</i>`
    );
    return NextResponse.json({ ok: true });
  }

  // ============================================================
  // INSERT no Supabase
  // ============================================================
  const insertPayload: Record<string, unknown> = {
    user_id: userId,
    times_apostados: timesApostados,
    detalhe_aposta: detalheAposta || timesApostados,
    odd,
    stake,
    status,
    data_criacao: new Date().toISOString(),
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
    `⚽ <b>Jogo:</b> ${timesApostados}\n` +
    `🎯 <b>Mercado:</b> ${detalheAposta}\n` +
    `📊 <b>Odd:</b> ${odd.toFixed(2)}\n` +
    `💰 <b>Stake:</b> R$ ${stake.toFixed(2)}\n` +
    `${emoji} <b>Status:</b> ${status}` +
    (valorCashout !== null ? `\n💵 <b>Retorno:</b> R$ ${Number(valorCashout).toFixed(2)}` : '');

  await sendTelegramMessage(chatId, successMsg);

  return NextResponse.json({ ok: true });
}
