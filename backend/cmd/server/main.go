package main

import (
	"database/sql"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"

	"github.com/hospitalk/backend/internal/handlers"
	"github.com/hospitalk/backend/internal/middleware"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	// Database connection
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("✅ Connected to Supabase PostgreSQL")

	// Setup Gin router
	router := gin.Default()

	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Health check
	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "hospitalk-api"})
	})

	// API Routes
	api := router.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		// Patients
		api.GET("/patients", handlers.GetPatients(db))
		api.GET("/patients/:id", handlers.GetPatientByID(db))
		api.POST("/patients", handlers.CreatePatient(db))
		api.PUT("/patients/:id", handlers.UpdatePatient(db))

		// Sessions
		api.GET("/sessions", handlers.GetSessions(db))
		api.GET("/sessions/:id", handlers.GetSessionByID(db))
		api.POST("/sessions", handlers.CreateSession(db))
		api.PATCH("/sessions/:id/end", handlers.EndSession(db))

		// Transcripts
		api.GET("/transcripts/:sessionId", handlers.GetTranscript(db))
		api.POST("/transcripts/:sessionId/messages", handlers.AddMessage(db))
		api.PUT("/transcripts/:sessionId", handlers.UpdateTranscript(db))

		// Audit Logs
		api.GET("/audit-logs", handlers.GetAuditLogs(db))
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 HOSPITALK API running on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
