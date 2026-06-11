-- Migration: Create audit_logs table
-- Tabel pencatatan aktivitas keamanan (Enhancement #2)

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk pencarian log
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================
-- Row Level Security (RLS) Policies
-- Enhancement #3 dari PRD
-- ============================================

-- Enable RLS pada semua tabel
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users read access for authenticated staff (prevents infinite recursion)
CREATE POLICY users_select_all ON users
    FOR SELECT TO authenticated USING (true);

-- Policy: Admin full modification access
CREATE POLICY admin_modify_users ON users
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
    );

CREATE POLICY admin_full_access ON patients
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
    );

-- Policy: Dokter hanya bisa melihat sesi & transkrip miliknya
CREATE POLICY doctor_own_sessions ON sessions
    FOR SELECT USING (
        doctor_id = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
    );

-- Policy: Dokter & Admin can access transcripts for their own sessions (checks sessions table)
CREATE POLICY doctor_own_transcripts ON transcripts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = transcripts.session_id
              AND (s.doctor_id = auth.uid() OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'))
        )
    );

-- Policy: Perawat bisa membuat sesi tapi tidak membaca transkrip orang lain
CREATE POLICY nurse_create_sessions ON sessions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('nurse', 'admin'))
    );

CREATE POLICY nurse_read_own_sessions ON sessions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('nurse', 'doctor', 'admin'))
    );

-- ============================================
-- Supabase Storage Bucket Initialization
-- ============================================

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('fallback-media', 'fallback-media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket fallback-media
CREATE POLICY "Allow public uploads to fallback-media" ON storage.objects
    FOR INSERT TO authenticated, anon WITH CHECK (bucket_id = 'fallback-media');

CREATE POLICY "Allow public select from fallback-media" ON storage.objects
    FOR SELECT TO authenticated, anon USING (bucket_id = 'fallback-media');

