import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getAnthropic, AI_MODELS } from '@/lib/anthropic'
import { getOpenAI, OPENAI_MODEL } from '@/lib/openai'
import { BLUEPRINT_SYSTEM_PROMPT, buildBlueprintPrompt, getScoreLabel } from '@/lib/prompts/blueprint'
import type { BlueprintContent } from '@/types/blueprint'
import type { Json, TablesInsert } from '@/types/database'

// ── ZOD ŞEMA ────────────────────────────────────────────────────────────────
const GenerateSchema = z.object({
  idea_text: z.string().min(10, 'En az 10 karakter').max(2000, 'En fazla 2000 karakter'),
  industry: z.string().max(100).optional(),
  stage: z.enum(['idea', 'mvp', 'growth', 'scale']).optional(),
  target_users: z.string().max(500).optional(),
  model: z.enum(['claude-sonnet-4-6', 'claude-opus-4-6']).default('claude-sonnet-4-6'),
})

// ── PLAN LİMİTLERİ ──────────────────────────────────────────────────────────
const PLAN_DAILY_LIMITS: Record<string, number> = {
  free: 5,
  pro: 50,
  team: 200,
}

export const runtime = 'nodejs'
export const maxDuration = 300

// Anthropic hatasının fallback gerektirip gerektirmediğini kontrol et
function shouldFallbackToOpenAI(err: unknown): boolean {
  if (!(err instanceof Error)) return true
  const msg = err.message.toLowerCase()
  // API key eksikliği — fallback dene
  if (msg.includes('api_key') || msg.includes('api key') || msg.includes('not set') || msg.includes('unauthorized') || msg.includes('authentication')) return true
  // 400 Bad Request, 429 Rate Limit, 500/529 Server Error
  return (
    msg.includes('400') ||
    msg.includes('429') ||
    msg.includes('500') ||
    msg.includes('529') ||
    msg.includes('overloaded') ||
    msg.includes('rate limit') ||
    msg.includes('bad request') ||
    msg.includes('internal server')
  )
}

// Token başına yaklaşık maliyet hesabı (USD)
function calculateCostUsd(
  provider: 'anthropic' | 'openai',
  model: string,
  tokensInput: number,
  tokensOutput: number
): number {
  if (provider === 'openai') {
    // gpt-4o-mini: $0.15/$0.60 per 1M tokens
    return (tokensInput / 1_000_000) * 0.15 + (tokensOutput / 1_000_000) * 0.60
  }
  // Anthropic
  const isOpus = model.includes('opus')
  const inputRate = isOpus ? 15 : 3    // $15/$3 per 1M input tokens
  const outputRate = isOpus ? 75 : 15  // $75/$15 per 1M output tokens
  return (tokensInput / 1_000_000) * inputRate + (tokensOutput / 1_000_000) * outputRate
}

// Blueprint JSON'dan build kit dosyaları üret
function generateBuildKitFiles(content: BlueprintContent): {
  cursorrules: string
  build_md: string
  schema_sql: string
  env_example: string
  readme_md: string
} {
  const { baslik, tech_stack, db_semasi, api_tasarim, ui_mimarisi, gelir_modeli } = content

  const cursorrules = `# ${baslik} — .cursorrules
# AI Agent Kodlama Kuralları

## PROJE
${baslik} — ${content.deger_onerisi.tek_cumle}

## TECH STACK
- Frontend: ${tech_stack.frontend}
- Backend: ${tech_stack.backend}
- Veritabanı: ${tech_stack.veritabani}
- Auth: ${tech_stack.auth}
- AI: ${tech_stack.ai}
- Email: ${tech_stack.email}
- Ödeme: ${tech_stack.odeme}
- Hosting: ${tech_stack.hosting}

## KURALLAR
1. TypeScript strict modu — \`any\` tipi kullanma
2. Server-side API anahtarları — client bundle'a asla ekleme
3. Supabase RLS her zaman açık
4. Her UI durumunu yaz: loading + error + empty + content
5. \`clsx\` + \`tailwind-merge\` ile className yönetimi

## KLASÖR YAPISI
src/
├── app/
│   ├── (public)/         # Auth, landing
│   ├── (dashboard)/      # Korumalı sayfalar
│   └── api/              # Route handlers
├── components/
│   ├── ui/               # Temel bileşenler
│   └── features/         # Özellik bileşenleri
├── lib/                  # Yardımcı fonksiyonlar
├── stores/               # Zustand store'ları
└── types/                # TypeScript tipleri`

  const apiList = api_tasarim.endpointler
    .map(e => `### ${e.method} ${e.yol}\n${e.aciklama}\n- Girdi: \`${e.girdi}\`\n- Çıktı: \`${e.cikti}\``)
    .join('\n\n')

  const pageList = ui_mimarisi.sayfalar
    .map(p => `- \`${p.yol}\` — **${p.ad}**: ${p.aciklama}`)
    .join('\n')

  const planList = gelir_modeli.planlar
    .map(p => `- **${p.ad}**: $${p.fiyat_aylik}/ay${p.fiyat_yillik ? ` ($${p.fiyat_yillik}/ay yıllık)` : ''} — ${p.hedef}`)
    .join('\n')

  const build_md = `# ${baslik} — Build Rehberi
SystemMD Blueprint tarafından üretildi.

## DEĞER ÖNERİSİ
${content.deger_onerisi.tek_cumle}

## PROBLEM
${content.problem.tanim}

**Hedef kullanıcı:** ${content.problem.kullanici}

## MVP ÖZELLİKLERİ
${content.mvp_kapsam.ozellikler.map(f => `- ${f}`).join('\n')}

**Kapsam dışı (sonraya):**
${content.mvp_kapsam.kapsam_disi.map(f => `- ${f}`).join('\n')}

## API TASARIMI
${apiList}

## SAYFALAR
${pageList}

## GELİR MODELİ
${gelir_modeli.model_turu}

${planList}

Hedef MRR (3 ay): ${gelir_modeli.hedef_mrr_3ay}
Hedef MRR (12 ay): ${gelir_modeli.hedef_mrr_12ay}

## SKOR
- Toplam: ${content.skor.toplam}/100 (${content.skor.etiket})
- Pazar: ${content.skor.pazar}/100
- Teknoloji: ${content.skor.teknoloji}/100
- Gelir: ${content.skor.gelir}/100
- Marka: ${content.skor.marka}/100

## GÜÇLü YÖNLER
${content.geri_bildirim.guclu_yonler.map(g => `- ${g}`).join('\n')}

## İYİLEŞTİRMELER
${content.geri_bildirim.iyilestirmeler.map(i => `- ${i}`).join('\n')}

## KRİTİK RİSKLER
${content.geri_bildirim.kritik_riskler.map(r => `- ${r}`).join('\n')}

## BU HAFTA YAP
${content.geri_bildirim.ilk_hafta_aksiyonlari.map((a, i) => `${i + 1}. ${a}`).join('\n')}`

  const schema_sql = db_semasi.sql

  const envKeys: string[] = [
    '# Supabase',
    'NEXT_PUBLIC_SUPABASE_URL=',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=',
    'SUPABASE_SERVICE_ROLE_KEY=',
    '',
  ]

  if (tech_stack.ai.toLowerCase().includes('anthropic') || tech_stack.ai.toLowerCase().includes('claude')) {
    envKeys.push('# Anthropic', 'ANTHROPIC_API_KEY=', '')
  }
  if (tech_stack.odeme.toLowerCase().includes('stripe')) {
    envKeys.push('# Stripe', 'STRIPE_SECRET_KEY=', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=', 'STRIPE_WEBHOOK_SECRET=', '')
  }
  if (tech_stack.email.toLowerCase().includes('resend')) {
    envKeys.push('# Resend', 'RESEND_API_KEY=', '')
  }
  envKeys.push('# App', 'NEXT_PUBLIC_APP_URL=http://localhost:3000')

  const env_example = envKeys.join('\n')

  const readme_md = `# ${baslik}

${content.deger_onerisi.tek_cumle}

## Hızlı Başlangıç

\`\`\`bash
npx create-next-app@latest ${baslik.toLowerCase().replace(/\s+/g, '-')} \\
  --typescript --tailwind --eslint --app --src-dir
cd ${baslik.toLowerCase().replace(/\s+/g, '-')}
npm install
\`\`\`

## Tech Stack

- **Frontend:** ${tech_stack.frontend}
- **Backend:** ${tech_stack.backend}
- **Veritabanı:** ${tech_stack.veritabani}
- **Auth:** ${tech_stack.auth}
- **AI:** ${tech_stack.ai}
- **Hosting:** ${tech_stack.hosting}

## Ortam Değişkenleri

\`.env.example\` dosyasını \`.env.local\` olarak kopyalayıp doldurun.

## Veritabanı

\`schema.sql\` dosyasını Supabase SQL editöründe çalıştırın.

---
*SystemMD Blueprint Platform tarafından üretildi.*`

  return { cursorrules, build_md, schema_sql, env_example, readme_md }
}

// SSE mesajı formatla
function sseMessage(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()

  // ── ÖN KONTROL: JSON parse + Zod validasyon (SSE başlamadan önce) ────────
  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Geçersiz JSON gövdesi' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const parsed = GenerateSchema.safeParse(rawBody)
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map(i => i.message).join(', ')
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const validatedBody = parsed.data

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sseMessage(data)))
      }

      const startTime = Date.now()

      try {
        // ── 1. AUTH KONTROL ──────────────────────────────────────────────────────
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          send({ type: 'error', message: 'Oturum açmanız gerekiyor.' })
          controller.close()
          return
        }

        // ── 2. KULLANICI PLAN BİLGİSİ ────────────────────────────────────────────
        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('plan, blueprint_count, api_tokens_used')
          .eq('id', user.id)
          .single()

        if (userError || !userRow) {
          send({ type: 'error', message: 'Kullanıcı bilgisi alınamadı.' })
          controller.close()
          return
        }

        // ── 3. RATE LİMİT (tüm planlar için günlük limit) ───────────────────────
        const plan = userRow.plan ?? 'free'
        const dailyLimit = PLAN_DAILY_LIMITS[plan] ?? PLAN_DAILY_LIMITS.free

        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const { count: todayCount, error: countError } = await supabase
          .from('blueprints')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', todayStart.toISOString())

        if (countError) {
          send({ type: 'error', message: 'Kullanım limiti kontrol edilemedi.' })
          controller.close()
          return
        }

        const used = todayCount ?? 0
        if (used >= dailyLimit) {
          send({
            type: 'error',
            message: 'Günlük limit aşıldı',
            limit: dailyLimit,
            used,
          })
          controller.close()
          return
        }

        const body = validatedBody

        // ── 4. MODEL SEÇİMİ ──────────────────────────────────────────────────────
        const canUsePower = userRow.plan !== 'free'
        const requestedModel = body.model ?? 'claude-sonnet-4-6'
        const isOpus = requestedModel === 'claude-opus-4-6'
        const modelKey = canUsePower && isOpus ? 'power' : 'standard'
        const modelId = AI_MODELS[modelKey]

        // ── 5. BLUEPRINT KAYDINI OLUŞTUR (status: generating) ───────────────────
        const { data: blueprintRow, error: insertError } = await supabase
          .from('blueprints')
          .insert({
            user_id: user.id,
            title: body.idea_text.substring(0, 100),
            idea_text: body.idea_text,
            industry: body.industry ?? null,
            stage: (body.stage as 'idea' | 'validation' | 'mvp' | 'growth') ?? null,
            target_users: body.target_users ?? null,
            status: 'generating',
            model_used: modelId,
            tokens_used: 0,
          })
          .select('id')
          .single()

        if (insertError || !blueprintRow) {
          send({ type: 'error', message: 'Blueprint kaydı oluşturulamadı.' })
          controller.close()
          return
        }

        const blueprintId = blueprintRow.id

        send({
          type: 'status',
          message: `Blueprint oluşturuluyor... (Model: ${modelId})`,
          blueprint_id: blueprintId,
        })

        // ── 6. AI STREAMİNG (Anthropic → OpenAI fallback) ───────────────────────
        const userPrompt = buildBlueprintPrompt({
          idea_text: body.idea_text,
          industry: body.industry,
          stage: body.stage,
          target_users: body.target_users,
        })

        let fullText = ''
        let chunkCount = 0
        let tokensInput = 0
        let tokensOutput = 0
        let usedProvider: 'anthropic' | 'openai' = 'anthropic'

        // ── 6a. ANTHROPIC DENEMESİ ──────────────────────────────────────────────
        try {
          const claudeStream = getAnthropic().messages.stream({
            model: modelId,
            max_tokens: 8192,
            system: BLUEPRINT_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userPrompt }],
          })

          for await (const event of claudeStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const chunk = event.delta.text
              fullText += chunk
              chunkCount++
              send({ type: 'chunk', content: chunk })

              if (chunkCount % 20 === 0) {
                const estimatedProgress = Math.min(
                  Math.round((fullText.length / 6000) * 90),
                  90
                )
                send({ type: 'progress', value: estimatedProgress })
              }
            }
          }

          const finalMessage = await claudeStream.finalMessage()
          tokensInput  = finalMessage.usage.input_tokens
          tokensOutput = finalMessage.usage.output_tokens
          usedProvider = 'anthropic'

        } catch (anthropicErr) {
          // ── 6b. OPENAI FALLBACK ──────────────────────────────────────────────
          if (!shouldFallbackToOpenAI(anthropicErr)) throw anthropicErr

          const anthropicErrMsg = anthropicErr instanceof Error ? anthropicErr.message : String(anthropicErr)
          send({
            type: 'status',
            message: `Anthropic API geçici olarak kullanılamıyor (${anthropicErrMsg.slice(0, 80)}). OpenAI'ya geçiliyor...`,
            blueprint_id: blueprintId,
          })

          fullText   = ''
          chunkCount = 0

          try {
            const openaiStream = await getOpenAI().chat.completions.create({
              model: OPENAI_MODEL,
              max_tokens: 8192,
              stream: true,
              stream_options: { include_usage: true },
              messages: [
                { role: 'system', content: BLUEPRINT_SYSTEM_PROMPT },
                { role: 'user',   content: userPrompt },
              ],
            })

            for await (const chunk of openaiStream) {
              const delta = chunk.choices[0]?.delta?.content
              if (delta) {
                fullText   += delta
                chunkCount++
                send({ type: 'chunk', content: delta })

                if (chunkCount % 20 === 0) {
                  const estimatedProgress = Math.min(
                    Math.round((fullText.length / 6000) * 90),
                    90
                  )
                  send({ type: 'progress', value: estimatedProgress })
                }
              }
              // Son chunk'ta usage bilgisi gelir
              if (chunk.usage) {
                tokensInput  = chunk.usage.prompt_tokens
                tokensOutput = chunk.usage.completion_tokens
              }
            }

            usedProvider = 'openai'

          } catch (openaiErr) {
            const openaiErrMsg = openaiErr instanceof Error ? openaiErr.message : String(openaiErr)
            await supabase.from('blueprints').update({ status: 'failed' }).eq('id', blueprintId)
            send({
              type: 'error',
              message: `Her iki AI servisi de başarısız oldu. Anthropic: ${anthropicErrMsg.slice(0, 100)} — OpenAI: ${openaiErrMsg.slice(0, 100)}`,
            })
            controller.close()
            return
          }
        }

        const tokensTotal = tokensInput + tokensOutput
        const durationMs  = Date.now() - startTime
        const costUsd     = calculateCostUsd(usedProvider, usedProvider === 'anthropic' ? modelId : OPENAI_MODEL, tokensInput, tokensOutput)

        send({ type: 'progress', value: 95 })

        // ── 7. JSON PARSE ────────────────────────────────────────────────────────
        let content: BlueprintContent
        try {
          // Kod bloğu markdown işaretleri varsa temizle
          const jsonText = fullText
            .replace(/^```(?:json)?\n?/i, '')
            .replace(/\n?```$/i, '')
            .trim()

          content = JSON.parse(jsonText) as BlueprintContent
        } catch {
          await supabase
            .from('blueprints')
            .update({ status: 'failed' })
            .eq('id', blueprintId)

          send({ type: 'error', message: 'Blueprint yanıtı JSON olarak ayrıştırılamadı.' })
          controller.close()
          return
        }

        // Skor etiketini hesapla (Claude bazen yanlış yazıyor)
        content.skor.etiket = getScoreLabel(content.skor.toplam)

        // ── 8. BLUEPRINT'İ GÜNCELLE ──────────────────────────────────────────────
        await supabase
          .from('blueprints')
          .update({
            title: content.baslik || body.idea_text.substring(0, 100),
            status: 'complete',
            score_total: content.skor.toplam,
            score_market: content.skor.pazar,
            score_tech: content.skor.teknoloji,
            score_revenue: content.skor.gelir,
            score_brand: content.skor.marka,
            tokens_used: tokensTotal,
            generation_ms: durationMs,
          })
          .eq('id', blueprintId)

        // ── 9. BLUEPRINT SECTIONS KAYDET ────────────────────────────────────────
        const toJson = (val: unknown): Json => val as Json

        const sections: TablesInsert<'blueprint_sections'>[] = [
          { blueprint_id: blueprintId, section_type: 'problem',          content: toJson(content.problem),          order_index: 0 },
          { blueprint_id: blueprintId, section_type: 'value_proposition', content: toJson(content.deger_onerisi),    order_index: 1 },
          { blueprint_id: blueprintId, section_type: 'mvp_scope',         content: toJson(content.mvp_kapsam),       order_index: 2 },
          { blueprint_id: blueprintId, section_type: 'tech_stack',        content: toJson(content.tech_stack),       order_index: 3 },
          { blueprint_id: blueprintId, section_type: 'db_schema',         content: toJson(content.db_semasi),        order_index: 4 },
          { blueprint_id: blueprintId, section_type: 'api_design',        content: toJson(content.api_tasarim),      order_index: 5 },
          { blueprint_id: blueprintId, section_type: 'ui_architecture',   content: toJson(content.ui_mimarisi),      order_index: 6 },
          { blueprint_id: blueprintId, section_type: 'revenue_model',     content: toJson(content.gelir_modeli),     order_index: 7 },
          {
            blueprint_id: blueprintId,
            section_type: 'build_kit_meta',
            content: toJson({ skor: content.skor, geri_bildirim: content.geri_bildirim }),
            order_index: 8,
          },
        ]

        await supabase.from('blueprint_sections').insert(sections)

        // ── 10. BUILD KİT DOSYALARINI OLUŞTUR VE KAYDET ──────────────────────────
        const kitFiles = generateBuildKitFiles(content)

        await supabase.from('build_kits').insert({
          blueprint_id: blueprintId,
          cursorrules: kitFiles.cursorrules,
          build_md: kitFiles.build_md,
          schema_sql: kitFiles.schema_sql,
          env_example: kitFiles.env_example,
          readme_md: kitFiles.readme_md,
        })

        // ── 11. API KULLANIMI KAYDET ──────────────────────────────────────────────
        await supabase.from('api_usage').insert({
          user_id: user.id,
          blueprint_id: blueprintId,
          action: 'blueprint_generate',
          model: usedProvider === 'anthropic' ? modelId : OPENAI_MODEL,
          tokens_input: tokensInput,
          tokens_output: tokensOutput,
          cost_usd: costUsd,
          duration_ms: durationMs,
        })

        // ── 12. KULLANICI SAYACINI GÜNCELLE ──────────────────────────────────────
        await supabase
          .from('users')
          .update({
            blueprint_count: (userRow.blueprint_count ?? 0) + 1,
            api_tokens_used: (userRow.api_tokens_used ?? 0) + tokensTotal,
          })
          .eq('id', user.id)

        send({ type: 'progress', value: 100 })
        send({ type: 'complete', blueprint_id: blueprintId, tokens_used: tokensTotal, model: usedProvider })

      } catch (err) {
        const rawMsg = err instanceof Error ? err.message : 'An unexpected error occurred.'
        // API key eksikliği durumunda açıklayıcı mesaj
        const message = rawMsg.toLowerCase().includes('api_key') || rawMsg.toLowerCase().includes('not set')
          ? 'AI service is not configured. Please add ANTHROPIC_API_KEY to your environment variables.'
          : rawMsg
        send({ type: 'error', message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
