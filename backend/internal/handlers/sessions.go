package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetSessions returns all sessions, optionally filtered by doctor_id or status
func GetSessions(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		query := `
			SELECT s.id, s.patient_id, s.doctor_id, s.start_time, s.end_time, s.status,
			       s.summary, s.synced_to_emr, s.created_at, s.updated_at,
			       p.name AS patient_name, u.name AS doctor_name
			FROM sessions s
			JOIN patients p ON s.patient_id = p.id
			JOIN users u ON s.doctor_id = u.id
			ORDER BY s.start_time DESC
		`
		rows, err := db.Query(query)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var sessions []map[string]interface{}
		for rows.Next() {
			var id, patientID, doctorID, startTime, status, patientName, doctorName string
			var createdAt, updatedAt string
			var summary sql.NullString
			var syncedToEMR bool
			var endTime sql.NullString
			if err := rows.Scan(&id, &patientID, &doctorID, &startTime, &endTime, &status, &summary, &syncedToEMR, &createdAt, &updatedAt, &patientName, &doctorName); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			session := map[string]interface{}{
				"id":            id,
				"patient_id":    patientID,
				"doctor_id":     doctorID,
				"start_time":    startTime,
				"status":        status,
				"synced_to_emr": syncedToEMR,
				"created_at":    createdAt,
				"updated_at":    updatedAt,
				"patient_name":  patientName,
				"doctor_name":   doctorName,
			}
			if endTime.Valid {
				session["end_time"] = endTime.String
			}
			if summary.Valid {
				session["summary"] = summary.String
			}
			sessions = append(sessions, session)
		}

		if sessions == nil {
			sessions = []map[string]interface{}{}
		}
		c.JSON(http.StatusOK, gin.H{"data": sessions})
	}
}

// GetSessionByID returns a single session
func GetSessionByID(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var patientID, doctorID, startTime, status string
		var createdAt, updatedAt string
		var summary sql.NullString
		var syncedToEMR bool
		var endTime sql.NullString

		err := db.QueryRow(`
			SELECT patient_id, doctor_id, start_time, end_time, status, summary, synced_to_emr, created_at, updated_at 
			FROM sessions WHERE id = $1
		`, id).Scan(&patientID, &doctorID, &startTime, &endTime, &status, &summary, &syncedToEMR, &createdAt, &updatedAt)

		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		session := map[string]interface{}{
			"id":            id,
			"patient_id":    patientID,
			"doctor_id":     doctorID,
			"start_time":    startTime,
			"status":        status,
			"synced_to_emr": syncedToEMR,
			"created_at":    createdAt,
			"updated_at":    updatedAt,
		}
		if endTime.Valid {
			session["end_time"] = endTime.String
		}
		if summary.Valid {
			session["summary"] = summary.String
		}
		c.JSON(http.StatusOK, gin.H{"data": session})
	}
}

// CreateSession creates a new consultation session
func CreateSession(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			PatientID string `json:"patient_id" binding:"required"`
			DoctorID  string `json:"doctor_id" binding:"required"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		sessionID := uuid.New().String()

		// Create session
		_, err := db.Exec(`
			INSERT INTO sessions (id, patient_id, doctor_id, status) 
			VALUES ($1, $2, $3, 'active')
		`, sessionID, input.PatientID, input.DoctorID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"data": map[string]interface{}{
			"session_id": sessionID,
			"status":     "active",
		}})
	}
}

// EndSession marks a session as completed
func EndSession(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		endTime := time.Now().Format(time.RFC3339)

		result, err := db.Exec(`
			UPDATE sessions SET status = 'completed', end_time = $1 WHERE id = $2 AND status = 'active'
		`, endTime, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Active session not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Session ended successfully", "end_time": endTime})
	}
}
