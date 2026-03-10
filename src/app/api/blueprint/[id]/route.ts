import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  BlueprintContent,
  BlueprintProblem,
  BlueprintDegerOnerisi,
  BlueprintMvpKapsam,
  BlueprintTechStack,
  BlueprintDbSemasi,
  BlueprintApiTasarim,
  BlueprintUiMimarisi,
  BlueprintGelirModeli,
  BlueprintSkor,
  BlueprintGeriBildirim,
} from '@/types/blueprint'

// Supabase Json tipinden güvenli cast yardımcısı
function castJson<T>(val: unknown): T {
  return val as T
}

interface BlueprintDetail {
  id: string
  title: string
  idea_text: string
  industry: string | null
  stage: string | null
  status: string
  score_total: number | null
  score_market: number | null
  score_tech: number | null
  score_revenue: number | null
  score_brand: number | null
  tokens_used: number
  model_used: string
  created_at: string
  content: BlueprintContent | null
  build_kit: {
    cursorrules: string | null
    build_md: string | null
    schema_sql: string | null
    env_example: string | null
    readme_md: string | null
  } | null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })
  }

  // Blueprint'i çek
  const { data: bp, error: bpError } = await supabase
    .from('blueprints')
    .select('id, title, idea_text, industry, stage, status, score_total, score_market, score_tech, score_revenue, score_brand, tokens_used, model_used, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (bpError || !bp) {
    return NextResponse.json({ error: 'Blueprint bulunamadı.' }, { status: 404 })
  }

  // Sections'ları çek ve content'e birleştir
  const { data: sections } = await supabase
    .from('blueprint_sections')
    .select('section_type, content')
    .eq('blueprint_id', id)
    .order('order_index')

  let content: BlueprintContent | null = null

  if (sections && sections.length > 0) {
    const sectionMap = Object.fromEntries(
      sections.map((s) => [s.section_type, s.content])
    )

    const buildKitMeta = castJson<Record<string, unknown>>(sectionMap['build_kit_meta'])

    const defaultSkor: BlueprintSkor = {
      toplam: (bp.score_total as number) ?? 0,
      pazar: (bp.score_market as number) ?? 0,
      teknoloji: (bp.score_tech as number) ?? 0,
      gelir: (bp.score_revenue as number) ?? 0,
      marka: (bp.score_brand as number) ?? 0,
      etiket: 'ORTA',
    }

    content = {
      baslik: bp.title as string,
      problem: castJson<BlueprintProblem>(sectionMap['problem']) ?? { tanim: '', kullanici: '', mevcut_cozum: '', neden_yetersiz: '', tam_adreslenebilir_pazar: '' },
      deger_onerisi: castJson<BlueprintDegerOnerisi>(sectionMap['value_proposition']) ?? { tek_cumle: '', hedef_kitle: '', fark: '' },
      mvp_kapsam: castJson<BlueprintMvpKapsam>(sectionMap['mvp_scope']) ?? { ozellikler: [], kapsam_disi: [], mvp_sorusu: '' },
      tech_stack: castJson<BlueprintTechStack>(sectionMap['tech_stack']) ?? { frontend: '', backend: '', veritabani: '', auth: '', ai: '', email: '', odeme: '', hosting: '', ek_servisler: [] },
      db_semasi: castJson<BlueprintDbSemasi>(sectionMap['db_schema']) ?? { tablolar: [], sql: '' },
      api_tasarim: castJson<BlueprintApiTasarim>(sectionMap['api_design']) ?? { endpointler: [] },
      ui_mimarisi: castJson<BlueprintUiMimarisi>(sectionMap['ui_architecture']) ?? { sayfalar: [], kritik_bilesenler: [] },
      gelir_modeli: castJson<BlueprintGelirModeli>(sectionMap['revenue_model']) ?? { model_turu: '', planlar: [], hedef_mrr_3ay: '', hedef_mrr_12ay: '' },
      skor: castJson<BlueprintSkor>(buildKitMeta?.['skor']) ?? defaultSkor,
      geri_bildirim: castJson<BlueprintGeriBildirim>(buildKitMeta?.['geri_bildirim']) ?? { guclu_yonler: [], iyilestirmeler: [], kritik_riskler: [], ilk_hafta_aksiyonlari: [] },
    }
  }

  // Build kit'i çek
  const { data: kit } = await supabase
    .from('build_kits')
    .select('cursorrules, build_md, schema_sql, env_example, readme_md')
    .eq('blueprint_id', id)
    .single()

  const result: BlueprintDetail = {
    id: bp.id as string,
    title: bp.title as string,
    idea_text: bp.idea_text as string,
    industry: (bp.industry as string | null) ?? null,
    stage: (bp.stage as string | null) ?? null,
    status: bp.status as string,
    score_total: (bp.score_total as number | null) ?? null,
    score_market: (bp.score_market as number | null) ?? null,
    score_tech: (bp.score_tech as number | null) ?? null,
    score_revenue: (bp.score_revenue as number | null) ?? null,
    score_brand: (bp.score_brand as number | null) ?? null,
    tokens_used: (bp.tokens_used as number) ?? 0,
    model_used: bp.model_used as string,
    created_at: bp.created_at as string,
    content,
    build_kit: kit
      ? {
          cursorrules: (kit.cursorrules as string | null) ?? null,
          build_md: (kit.build_md as string | null) ?? null,
          schema_sql: (kit.schema_sql as string | null) ?? null,
          env_example: (kit.env_example as string | null) ?? null,
          readme_md: (kit.readme_md as string | null) ?? null,
        }
      : null,
  }

  return NextResponse.json(result)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })
  }

  // Önce kendi blueprint'i mi kontrol et
  const { data: bp, error: findError } = await supabase
    .from('blueprints')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (findError || !bp) {
    return NextResponse.json({ error: 'Blueprint bulunamadı.' }, { status: 404 })
  }

  const { error: deleteError } = await supabase
    .from('blueprints')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('[blueprint/[id]] Silme hatası:', deleteError)
    return NextResponse.json({ error: 'Blueprint silinemedi.' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
