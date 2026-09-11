package services

import (
	"errors"
	"fmt"
	"time"

	"hayday-order-system/backend/internal/config"
	"hayday-order-system/backend/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	db  *gorm.DB
	cfg config.Config
}

type Claims struct {
	AdminID uint   `json:"adminId"`
	Role    string `json:"role"`
	jwt.RegisteredClaims
}

func NewAuthService(db *gorm.DB, cfg config.Config) *AuthService {
	return &AuthService{db: db, cfg: cfg}
}

func (s *AuthService) EnsureSeedAdmin() error {
	var count int64
	if err := s.db.Model(&models.AdminUser{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(s.cfg.SeedAdminPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	admin := models.AdminUser{
		Username:     s.cfg.SeedAdminUsername,
		PasswordHash: string(hash),
		Role:         s.cfg.SeedAdminRole,
	}
	return s.db.Create(&admin).Error
}

func (s *AuthService) Login(username, password string) (string, *models.AdminUser, error) {
	var admin models.AdminUser
	if err := s.db.Where("username = ?", username).First(&admin).Error; err != nil {
		return "", nil, errors.New("tài khoản hoặc mật khẩu không đúng")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(password)); err != nil {
		return "", nil, errors.New("tài khoản hoặc mật khẩu không đúng")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
		AdminID: admin.ID,
		Role:    admin.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   fmt.Sprintf("%d", admin.ID),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	})

	signed, err := token.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return "", nil, err
	}

	return signed, &admin, nil
}

func (s *AuthService) ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.cfg.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("token không hợp lệ")
	}
	return claims, nil
}
