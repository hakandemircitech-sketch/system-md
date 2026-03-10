// ============================================================
// SystemMD BLUEPRINT PLATFORM — src/lib/prompts/blueprint.ts
// Claude API için Blueprint Üretim Promptu
// ============================================================

export const BLUEPRINT_SYSTEM_PROMPT = `Sen SystemMD Blueprint Platform'un AI mimarısın.
Sana verilen startup fikri için eksiksiz, uygulanabilir bir ürün + sistem mimarisi üretiyorsun.

KURALLAR:
1. SADECE geçerli JSON döndür — başka hiçbir şey yazma, markdown kullanma
2. Tüm alanları doldur — boş bırakma
3. Türkçe yaz (kod/SQL/teknik terimler İngilizce kalabilir)
4. Gerçekçi ol — pazar verisi, fiyatlar, özellikler somut olsun
5. Tech stack modern ve uygun olsun — Next.js + Supabase + Stripe tercih et
6. DB şeması çalışır SQL olsun — syntax hatası olmasın
7. Skorlar 0-100 aralığında, gerçekçi değerlendirme yap
8. JSON yapısı kesinlikle aşağıdaki formatta olmalı — fazla alan ekleme, eksik alan bırakma`

export function buildBlueprintPrompt(input: {
  idea_text: string
  industry?: string
  stage?: string
  target_users?: string
}): string {
  return `Startup fikri: "${input.idea_text}"
Sektör: ${input.industry || 'Belirtilmedi'}
Aşama: ${input.stage || 'idea'}
Hedef kullanıcılar: ${input.target_users || 'Belirtilmedi'}

Bu fikir için aşağıdaki JSON yapısını AYNEN doldur. Yanıtın SADECE JSON olsun:

{
  "baslik": "Kısa, akılda kalıcı proje adı",

  "problem": {
    "tanim": "Çözülen spesifik problem (1-2 cümle)",
    "kullanici": "Kim bu problemi yaşıyor (detaylı persona)",
    "mevcut_cozum": "Şu an nasıl çözüyorlar",
    "neden_yetersiz": "Mevcut çözümlerin neden eksik kaldığı",
    "tam_adreslenebilir_pazar": "Tahmini TAM değeri (ör: $4.2B)"
  },

  "deger_onerisi": {
    "tek_cumle": "[Hedef kitle] için [problem] çözen [ürün], [alternatiflerden farkı]",
    "hedef_kitle": "Spesifik kullanıcı segmenti",
    "fark": "Rakiplerden 3 somut farklılık"
  },

  "mvp_kapsam": {
    "ozellikler": ["Özellik 1", "Özellik 2", "Özellik 3", "Özellik 4", "Özellik 5"],
    "kapsam_disi": ["Sonraya bırakılan özellik 1", "Sonraya bırakılan özellik 2"],
    "mvp_sorusu": "Kullanıcıya değer yaratmak için minimum ne gerekir?"
  },

  "tech_stack": {
    "frontend": "Next.js 14 App Router + TypeScript + Tailwind CSS",
    "backend": "Next.js API Routes (Edge Runtime)",
    "veritabani": "Supabase PostgreSQL 15 + Row Level Security",
    "auth": "Supabase Auth",
    "ai": "Anthropic Claude API (belirt hangi model ve neden)",
    "email": "Resend + React Email",
    "odeme": "Stripe",
    "hosting": "Vercel",
    "ek_servisler": ["Varsa ek servisler"]
  },

  "db_semasi": {
    "tablolar": [
      {
        "ad": "tablo_adi",
        "aciklama": "Bu tablonun amacı",
        "alanlar": ["id UUID", "user_id UUID", "created_at TIMESTAMPTZ"]
      }
    ],
    "sql": "CREATE TABLE users (\\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\\n  email TEXT UNIQUE NOT NULL,\\n  created_at TIMESTAMPTZ DEFAULT now()\\n);\\n\\nCREATE TABLE ... (tam, çalışan SQL, her tablo için)"
  },

  "api_tasarim": {
    "endpointler": [
      {
        "method": "POST",
        "yol": "/api/ornek",
        "aciklama": "Ne yapar",
        "girdi": "{ field: type }",
        "cikti": "{ field: type }"
      }
    ]
  },

  "ui_mimarisi": {
    "sayfalar": [
      {"yol": "/", "ad": "Landing Page", "aciklama": "Ne gösterir"},
      {"yol": "/dashboard", "ad": "Dashboard", "aciklama": "Ne gösterir"}
    ],
    "kritik_bilesenler": ["Bileşen 1", "Bileşen 2"]
  },

  "gelir_modeli": {
    "model_turu": "SaaS abonelik / kullanım bazlı / freemium (seç ve açıkla)",
    "planlar": [
      {"ad": "Ücretsiz", "fiyat_aylik": 0, "ozellikler": ["Özellik 1"], "hedef": "Deneme"},
      {"ad": "Pro", "fiyat_aylik": 19, "fiyat_yillik": 15, "ozellikler": ["Tüm özellikler"], "hedef": "Solo builder"},
      {"ad": "Agency", "fiyat_aylik": 59, "fiyat_yillik": 47, "ozellikler": ["Her şey + ekip"], "hedef": "Ajans"}
    ],
    "hedef_mrr_3ay": "$X,XXX",
    "hedef_mrr_12ay": "$XX,XXX"
  },

  "skor": {
    "toplam": 0,
    "pazar": 0,
    "teknoloji": 0,
    "gelir": 0,
    "marka": 0,
    "etiket": "ZAYIF / ORTA / GÜÇLÜ / İSTİSNAİ"
  },

  "geri_bildirim": {
    "guclu_yonler": ["Güçlü yön 1", "Güçlü yön 2", "Güçlü yön 3"],
    "iyilestirmeler": ["İyileştirme önerisi 1", "İyileştirme önerisi 2"],
    "kritik_riskler": ["Risk 1", "Risk 2"],
    "ilk_hafta_aksiyonlari": ["Bu hafta ne yapmalısın 1", "2", "3"]
  }
}`
}

// Skor etiketi hesapla
export function getScoreLabel(score: number): 'İSTİSNAİ' | 'GÜÇLÜ' | 'ORTA' | 'ZAYIF' {
  if (score >= 86) return 'İSTİSNAİ'
  if (score >= 71) return 'GÜÇLÜ'
  if (score >= 51) return 'ORTA'
  return 'ZAYIF'
}

export function getScoreColor(score: number): string {
  if (score >= 86) return 'var(--green)'
  if (score >= 71) return 'var(--accent)'
  if (score >= 51) return 'var(--yellow)'
  return 'var(--red)'
}
