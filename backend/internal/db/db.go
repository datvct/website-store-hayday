package db

import (
	"fmt"
	"log"
	"time"

	"hayday-order-system/backend/internal/config"
	"hayday-order-system/backend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Open(cfg config.Config) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("get sql db: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(20)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return db, nil
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.Product{},
		&models.Category{},
		&models.Order{},
		&models.OrderItem{},
		&models.AdminUser{},
		&models.Setting{},
	)
}

func MustAutoMigrate(db *gorm.DB) {
	if err := AutoMigrate(db); err != nil {
		log.Fatalf("auto migrate: %v", err)
	}
}
