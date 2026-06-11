package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetTranscript returns the transcript for a given session
func GetTranscript(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID := c.Param("sessionId")

		var patientID, doctorID string
		var summary sql.NullString
		var syncedToEMR bool

		// Get session metadata first
		err := db.QueryRow(`
			SELECT patient_id, doctor_id, summary, synced_to_emr
			FROM sessions WHERE id = $1
		`, sessionID).Scan(&patientID, &doctorID, &summary, &syncedToEMR)

		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Fetch messages for this session
		rows, err := db.Query(`
			SELECT id, sender_type, content, confidence_score, timestamp, is_edited
			FROM transcripts WHERE session_id = $1 ORDER BY timestamp ASC
		`, sessionID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		messages := []map[string]interface{}{}
		for rows.Next() {
			var msgID, senderType, content, timestamp string
			var confidenceScore sql.NullFloat64
			var isEdited bool
			if err := rows.Scan(&msgID, &senderType, &content, &confidenceScore, &timestamp, &isEdited); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			msg := map[string]interface{}{
				"message_id":          msgID,
				"timestamp":           timestamp,
				"sender_type":         senderType,
				"content":             content,
				"ai_confidence_score": 0.0,
				"is_edited":           isEdited,
			}
			if confidenceScore.Valid {
				msg["ai_confidence_score"] = confidenceScore.Float64
			}
			messages = append(messages, msg)
		}

		transcript := map[string]interface{}{
			"id":            sessionID, // Using session ID as transcript container ID for compatibility
			"session_id":    sessionID,
			"patient_id":    patientID,
			"doctor_id":     doctorID,
			"messages":      messages,
			"synced_to_emr": syncedToEMR,
		}
		if summary.Valid {
			transcript["summary"] = summary.String
		}

		c.JSON(http.StatusOK, gin.H{"data": transcript})
	}
}

// AddMessage adds a new message to a session's transcript
func AddMessage(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID := c.Param("sessionId")

		var input struct {
			SenderType        string  `json:"sender_type" binding:"required"`
			InputMethod       string  `json:"input_method" binding:"required"`
			Content           string  `json:"content" binding:"required"`
			AIConfidenceScore float64 `json:"ai_confidence_score"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		messageID := uuid.New().String()
		timestamp := time.Now().Format(time.RFC3339)

		// Insert row into transcripts table
		_, err := db.Exec(`
			INSERT INTO transcripts (id, session_id, sender_type, content, confidence_score, timestamp, is_edited)
			VALUES ($1, $2, $3, $4, $5, $6, false)
		`, messageID, sessionID, input.SenderType, input.Content, input.AIConfidenceScore, timestamp)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		newMessage := map[string]interface{}{
			"message_id":          messageID,
			"timestamp":           timestamp,
			"sender_type":         input.SenderType,
			"input_method":        input.InputMethod,
			"content":             input.Content,
			"ai_confidence_score": input.AIConfidenceScore,
			"is_edited":           false,
		}

		c.JSON(http.StatusCreated, gin.H{"data": newMessage})
	}
}

// UpdateTranscript updates the session summary and sync status
func UpdateTranscript(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID := c.Param("sessionId")

		var input struct {
			Summary     *string `json:"summary"`
			SyncedToEMR *bool   `json:"synced_to_emr"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Update in sessions table where summary and synced_to_emr reside now
		result, err := db.Exec(`
			UPDATE sessions SET 
				summary = COALESCE($1, summary), 
				synced_to_emr = COALESCE($2, synced_to_emr), 
				updated_at = NOW()
			WHERE id = $3
		`, input.Summary, input.SyncedToEMR, sessionID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Transcript metadata updated successfully"})
	}
}

// GetAuditLogs returns audit log entries
func GetAuditLogs(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.Query(`
			SELECT al.id, al.user_id, al.action, al.resource_type, al.resource_id, 
			       al.ip_address, al.created_at, u.name AS user_name
			FROM audit_logs al
			JOIN users u ON al.user_id = u.id
			ORDER BY al.created_at DESC
			LIMIT 100
		`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var logs []map[string]interface{}
		for rows.Next() {
			var id, userID, action, resourceType, createdAt, userName string
			var resourceID, ipAddress sql.NullString
			if err := rows.Scan(&id, &userID, &action, &resourceType, &resourceID, &ipAddress, &createdAt, &userName); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			entry := map[string]interface{}{
				"id":            id,
				"user_id":       userID,
				"action":        action,
				"resource_type": resourceType,
				"created_at":    createdAt,
				"user_name":     userName,
			}
			if resourceID.Valid {
				entry["resource_id"] = resourceID.String
			}
			if ipAddress.Valid {
				entry["ip_address"] = ipAddress.String
			}
			logs = append(logs, entry)
		}

		if logs == nil {
			logs = []map[string]interface{}{}
		}
		c.JSON(http.StatusOK, gin.H{"data": logs})
	}
}
