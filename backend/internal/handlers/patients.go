package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetPatients returns all patients
func GetPatients(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.Query(`
			SELECT id, medical_record_id, name, disability_type, dob, created_at 
			FROM patients ORDER BY created_at DESC
		`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var patients []map[string]interface{}
		for rows.Next() {
			var id, medRecID, name, disType, dob, createdAt string
			if err := rows.Scan(&id, &medRecID, &name, &disType, &dob, &createdAt); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			patients = append(patients, map[string]interface{}{
				"id":                id,
				"medical_record_id": medRecID,
				"name":              name,
				"disability_type":   disType,
				"dob":               dob,
				"created_at":        createdAt,
			})
		}

		if patients == nil {
			patients = []map[string]interface{}{}
		}
		c.JSON(http.StatusOK, gin.H{"data": patients})
	}
}

// GetPatientByID returns a single patient by ID
func GetPatientByID(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var medRecID, name, disType, dob, createdAt string
		err := db.QueryRow(`
			SELECT medical_record_id, name, disability_type, dob, created_at 
			FROM patients WHERE id = $1
		`, id).Scan(&medRecID, &name, &disType, &dob, &createdAt)

		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": map[string]interface{}{
			"id":                id,
			"medical_record_id": medRecID,
			"name":              name,
			"disability_type":   disType,
			"dob":               dob,
			"created_at":        createdAt,
		}})
	}
}

// CreatePatient creates a new patient record
func CreatePatient(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			MedicalRecordID string `json:"medical_record_id" binding:"required"`
			Name            string `json:"name" binding:"required"`
			DisabilityType  string `json:"disability_type" binding:"required"`
			DOB             string `json:"dob" binding:"required"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		id := uuid.New().String()
		_, err := db.Exec(`
			INSERT INTO patients (id, medical_record_id, name, disability_type, dob) 
			VALUES ($1, $2, $3, $4, $5)
		`, id, input.MedicalRecordID, input.Name, input.DisabilityType, input.DOB)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"data": map[string]interface{}{
			"id":                id,
			"medical_record_id": input.MedicalRecordID,
			"name":              input.Name,
			"disability_type":   input.DisabilityType,
			"dob":               input.DOB,
		}})
	}
}

// UpdatePatient updates an existing patient record
func UpdatePatient(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var input struct {
			Name           string `json:"name"`
			DisabilityType string `json:"disability_type"`
			DOB            string `json:"dob"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		result, err := db.Exec(`
			UPDATE patients SET name = $1, disability_type = $2, dob = $3 WHERE id = $4
		`, input.Name, input.DisabilityType, input.DOB, id)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Patient updated successfully"})
	}
}
