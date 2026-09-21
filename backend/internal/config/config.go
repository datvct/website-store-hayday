package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Env                 string
	Port                string
	DatabaseURL         string
	JWTSecret           string
	FrontendOrigin      string
	ShopName            string
	BankCode            string
	BankAccount         string
	BankAccountName     string
	MomoPhone           string
	MomoAccountName     string
	SeedAdminUsername   string
	SeedAdminPassword   string
	SeedAdminRole       string
	SeedProductsFile    string
	SeedOnStartup       bool
	ImageStorageBaseURL string
	DefaultPageSize     int
	MaxPageSize         int
}

func getEnv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func getEnvInt(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func Load() Config {
	return Config{
		Env:                 getEnv("APP_ENV", "development"),
		Port:                getEnv("PORT", "8080"),
		DatabaseURL:         getEnv("DATABASE_URL", ""),
		JWTSecret:           getEnv("JWT_SECRET", "change-me-in-production"),
		FrontendOrigin:      getEnv("FRONTEND_ORIGIN", "http://localhost:5173"),
		ShopName:            getEnv("SHOP_NAME", "Hay Day Order"),
		BankCode:            getEnv("BANK_CODE", ""),
		BankAccount:         getEnv("BANK_ACCOUNT", ""),
		BankAccountName:     getEnv("BANK_ACCOUNT_NAME", ""),
		MomoPhone:           getEnv("MOMO_PHONE", ""),
		MomoAccountName:     getEnv("MOMO_ACCOUNT_NAME", ""),
		SeedAdminUsername:   getEnv("ADMIN_USERNAME", "admin"),
		SeedAdminPassword:   getEnv("ADMIN_PASSWORD", "admin123456"),
		SeedAdminRole:       getEnv("ADMIN_ROLE", "admin"),
		SeedProductsFile:    getEnv("SEED_PRODUCTS_FILE", "seeds/products.json"),
		SeedOnStartup:       strings.EqualFold(getEnv("SEED_ON_STARTUP", "false"), "true"),
		ImageStorageBaseURL: getEnv("IMAGE_STORAGE_BASE_URL", ""),
		DefaultPageSize:     getEnvInt("DEFAULT_PAGE_SIZE", 24),
		MaxPageSize:         getEnvInt("MAX_PAGE_SIZE", 100),
	}
}

func (c Config) Validate() error {
	if strings.TrimSpace(c.DatabaseURL) == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	if strings.TrimSpace(c.JWTSecret) == "" {
		return fmt.Errorf("JWT_SECRET is required")
	}
	return nil
}
