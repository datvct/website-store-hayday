package main

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"

	"hayday-order-system/backend/internal/config"
	"hayday-order-system/backend/internal/db"
	"hayday-order-system/backend/internal/models"
	"hayday-order-system/backend/internal/router"
	"hayday-order-system/backend/internal/services"

	"github.com/joho/godotenv"
)

func loadEnv() {
	_ = godotenv.Load()
	_ = godotenv.Load(filepath.Join("..", ".env"))
	_ = godotenv.Load(filepath.Join("..", "..", ".env"))
}

func main() {
	loadEnv()
	cfg := config.Load()
	if err := cfg.Validate(); err != nil {
		log.Fatalf("config invalid: %v", err)
	}

	database, err := db.Open(cfg)
	if err != nil {
		log.Fatalf("db open: %v", err)
	}
	db.MustAutoMigrate(database)

	paymentService := services.NewPaymentService(cfg)
	authService := services.NewAuthService(database, cfg)
	productService := services.NewProductService(database)
	orderService := services.NewOrderService(database, paymentService)

	if err := authService.EnsureSeedAdmin(); err != nil {
		log.Fatalf("seed admin: %v", err)
	}
	if err := seedProducts(productService, cfg.SeedProductsFile); err != nil {
		log.Fatalf("seed products: %v", err)
	}

	engine := router.New(authService, productService, orderService)
	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	log.Printf("server listening on :%s", port)
	if err := engine.Run(":" + port); err != nil {
		_, _ = os.Stderr.WriteString(err.Error())
	}
}

// seedProducts is idempotent: existing products are updated by sourceTitle,
// so restarting the container never creates duplicate catalog rows.
func seedProducts(productService *services.ProductService, filename string) error {
	data, err := os.ReadFile(filename)
	if err != nil {
		return err
	}

	var products []models.Product
	if err := json.Unmarshal(data, &products); err != nil {
		return err
	}
	if err := productService.UpsertSeed(products); err != nil {
		return err
	}
	log.Printf("seeded %d products from %s", len(products), filepath.Clean(filename))
	return nil
}
