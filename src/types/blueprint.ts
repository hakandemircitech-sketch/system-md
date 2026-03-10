// SystemMD Blueprint Tipleri — blueprint-prompt.ts JSON çıktısıyla tam uyumlu

export interface BlueprintProblem {
  tanim: string
  kullanici: string
  mevcut_cozum: string
  neden_yetersiz: string
  tam_adreslenebilir_pazar: string
}

export interface BlueprintDegerOnerisi {
  tek_cumle: string
  hedef_kitle: string
  fark: string
}

export interface BlueprintMvpKapsam {
  ozellikler: string[]
  kapsam_disi: string[]
  mvp_sorusu: string
}

export interface BlueprintTechStack {
  frontend: string
  backend: string
  veritabani: string
  auth: string
  ai: string
  email: string
  odeme: string
  hosting: string
  ek_servisler: string[]
}

export interface BlueprintDbTablo {
  ad: string
  aciklama: string
  alanlar: string[]
}

export interface BlueprintDbSemasi {
  tablolar: BlueprintDbTablo[]
  sql: string
}

export interface BlueprintApiEndpoint {
  method: string
  yol: string
  aciklama: string
  girdi: string
  cikti: string
}

export interface BlueprintApiTasarim {
  endpointler: BlueprintApiEndpoint[]
}

export interface BlueprintSayfa {
  yol: string
  ad: string
  aciklama: string
}

export interface BlueprintUiMimarisi {
  sayfalar: BlueprintSayfa[]
  kritik_bilesenler: string[]
}

export interface BlueprintPlan {
  ad: string
  fiyat_aylik: number
  fiyat_yillik?: number
  ozellikler: string[]
  hedef: string
}

export interface BlueprintGelirModeli {
  model_turu: string
  planlar: BlueprintPlan[]
  hedef_mrr_3ay: string
  hedef_mrr_12ay: string
}

export interface BlueprintSkor {
  toplam: number
  pazar: number
  teknoloji: number
  gelir: number
  marka: number
  etiket: 'ZAYIF' | 'ORTA' | 'GÜÇLÜ' | 'İSTİSNAİ'
}

export interface BlueprintGeriBildirim {
  guclu_yonler: string[]
  iyilestirmeler: string[]
  kritik_riskler: string[]
  ilk_hafta_aksiyonlari: string[]
}

export interface BlueprintContent {
  baslik: string
  problem: BlueprintProblem
  deger_onerisi: BlueprintDegerOnerisi
  mvp_kapsam: BlueprintMvpKapsam
  tech_stack: BlueprintTechStack
  db_semasi: BlueprintDbSemasi
  api_tasarim: BlueprintApiTasarim
  ui_mimarisi: BlueprintUiMimarisi
  gelir_modeli: BlueprintGelirModeli
  skor: BlueprintSkor
  geri_bildirim: BlueprintGeriBildirim
}

export interface Blueprint {
  id: string
  user_id: string
  title: string
  idea_text: string
  industry: string | null
  stage: 'idea' | 'validation' | 'mvp' | 'growth' | null
  target_users: string | null
  model_used: string
  content: BlueprintContent | null
  score_total: number | null
  score_market: number | null
  score_tech: number | null
  score_revenue: number | null
  score_brand: number | null
  tokens_used: number
  status: 'generating' | 'complete' | 'failed'
  is_public: boolean
  public_slug: string | null
  created_at: string
  updated_at: string
}

// SSE event tipleri (client-side streaming için)
export type SseEventType = 'status' | 'chunk' | 'progress' | 'complete' | 'error'

export interface SseEvent {
  type: SseEventType
  message?: string
  content?: string
  value?: number
  blueprint_id?: string
  tokens_used?: number
}
