-- Migration: Create patients table
-- Tabel data pasien

CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_record_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    disability_type VARCHAR(50) NOT NULL CHECK (disability_type IN ('deaf', 'mute', 'both')),
    dob DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk pencarian
CREATE INDEX idx_patients_medical_record ON patients(medical_record_id);
CREATE INDEX idx_patients_name ON patients(name);
