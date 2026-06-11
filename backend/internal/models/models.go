package models

import "time"

// User represents a medical staff or admin
type User struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Role         string    `json:"role"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

// Patient represents a patient record
type Patient struct {
	ID              string `json:"id"`
	MedicalRecordID string `json:"medical_record_id"`
	Name            string `json:"name"`
	DisabilityType  string `json:"disability_type"`
	DOB             string `json:"dob"`
	CreatedAt       string `json:"created_at"`
}

// Session represents a consultation session
type Session struct {
	ID          string  `json:"id"`
	PatientID   string  `json:"patient_id"`
	DoctorID    string  `json:"doctor_id"`
	StartTime   string  `json:"start_time"`
	EndTime     *string `json:"end_time"`
	Status      string  `json:"status"`
	Summary     *string `json:"summary"`
	SyncedToEMR bool    `json:"synced_to_emr"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

// Message represents a single message in a transcript (kept for compatibility if needed, but transcripts is now row-based)
type Message struct {
	MessageID         string  `json:"message_id"`
	Timestamp         string  `json:"timestamp"`
	SenderType        string  `json:"sender_type"`
	InputMethod       string  `json:"input_method"`
	Content           string  `json:"content"`
	AIConfidenceScore float64 `json:"ai_confidence_score"`
	IsEdited          bool    `json:"is_edited"`
}

// Transcript represents a single message row in transcripts table
type Transcript struct {
	ID              string   `json:"id"`
	SessionID       string   `json:"session_id"`
	SenderType      string   `json:"sender_type"`
	Content         string   `json:"content"`
	ConfidenceScore *float64 `json:"confidence_score"`
	Timestamp       string   `json:"timestamp"`
	IsEdited        bool     `json:"is_edited"`
	CreatedAt       string   `json:"created_at"`
	UpdatedAt       string   `json:"updated_at"`
}

// AuditLog represents an audit trail entry
type AuditLog struct {
	ID           string  `json:"id"`
	UserID       string  `json:"user_id"`
	Action       string  `json:"action"`
	ResourceType string  `json:"resource_type"`
	ResourceID   *string `json:"resource_id"`
	Details      *string `json:"details"`
	IPAddress    *string `json:"ip_address"`
	CreatedAt    string  `json:"created_at"`
}
