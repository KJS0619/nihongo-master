-- nihongo-master 복습 시스템 Supabase 테이블
-- Supabase 대시보드 SQL Editor에서 실행

-- 1. 복습 진도 테이블
CREATE TABLE IF NOT EXISTS review_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'anonymous',  -- 추후 인증 연동 시 사용
  item_id TEXT NOT NULL,                       -- 한자/단어/문법 ID
  item_type TEXT NOT NULL CHECK (item_type IN ('word', 'grammar', 'kanji')),
  ease_factor DECIMAL(3,2) DEFAULT 2.5,
  interval INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_review_date DATE,
  total_reviews INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 유니크 제약: 같은 사용자가 같은 아이템을 중복 등록하지 않도록
  UNIQUE(user_id, item_id, item_type)
);

-- 2. 사용자 통계 테이블
CREATE TABLE IF NOT EXISTS review_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'anonymous' UNIQUE,
  today_due INTEGER DEFAULT 0,
  today_completed INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  total_mastered INTEGER DEFAULT 0,
  accuracy INTEGER DEFAULT 0,
  last_study_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 주간 학습 데이터 테이블
CREATE TABLE IF NOT EXISTS review_weekly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  study_date DATE NOT NULL,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, study_date)
);

-- 인덱스 생성 (쿼리 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_review_progress_user ON review_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_review_progress_next_date ON review_progress(next_review_date);
CREATE INDEX IF NOT EXISTS idx_review_progress_type ON review_progress(item_type);
CREATE INDEX IF NOT EXISTS idx_review_weekly_user ON review_weekly(user_id);
CREATE INDEX IF NOT EXISTS idx_review_weekly_date ON review_weekly(study_date);

-- RLS (Row Level Security) 정책 - 모든 사용자 접근 허용 (anonymous 모드)
ALTER TABLE review_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_weekly ENABLE ROW LEVEL SECURITY;

-- anonymous 사용자도 CRUD 가능하도록 정책 설정
CREATE POLICY "Allow all for review_progress" ON review_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for review_stats" ON review_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for review_weekly" ON review_weekly FOR ALL USING (true) WITH CHECK (true);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_review_progress_updated_at
  BEFORE UPDATE ON review_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_review_stats_updated_at
  BEFORE UPDATE ON review_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
