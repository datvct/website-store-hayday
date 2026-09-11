package services

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"

	"hayday-order-system/backend/internal/config"
)

type PaymentService struct {
	cfg config.Config
}

func NewPaymentService(cfg config.Config) *PaymentService {
	return &PaymentService{cfg: cfg}
}

func (s *PaymentService) BuildPaymentContent(orderCode string) string {
	return fmt.Sprintf("HD %s", orderCode)
}

func (s *PaymentService) BuildQRURL(amount int64, orderCode string) string {
	content := url.QueryEscape(s.BuildPaymentContent(orderCode))
	accountName := url.QueryEscape(strings.TrimSpace(s.cfg.BankAccountName))

	if s.cfg.BankCode != "" && s.cfg.BankAccount != "" {
		return fmt.Sprintf(
			"https://img.vietqr.io/image/%s-%s-qr_only.png?amount=%s&addInfo=%s&accountName=%s",
			url.PathEscape(s.cfg.BankCode),
			url.PathEscape(s.cfg.BankAccount),
			strconv.FormatInt(amount, 10),
			content,
			accountName,
		)
	}

	if s.cfg.MomoPhone != "" {
		return fmt.Sprintf(
			"https://img.vietqr.io/image/MB-%s-qr_only.png?amount=%s&addInfo=%s&accountName=%s",
			url.PathEscape(s.cfg.MomoPhone),
			strconv.FormatInt(amount, 10),
			content,
			accountName,
		)
	}

	return ""
}
