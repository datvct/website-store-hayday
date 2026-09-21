package services

import (
	"fmt"
	"net/smtp"
	"strconv"
	"strings"

	"hayday-order-system/backend/internal/models"
)

type EmailNotifier struct {
	host     string
	port     string
	username string
	password string
	from     string
	to       string
}

func NewEmailNotifier(host, port, username, password, from, to string) *EmailNotifier {
	return &EmailNotifier{
		host: strings.TrimSpace(host), port: strings.TrimSpace(port),
		username: strings.TrimSpace(username), password: password,
		from: strings.TrimSpace(from), to: strings.TrimSpace(to),
	}
}

func (n *EmailNotifier) Enabled() bool {
	return n != nil && n.host != "" && n.port != "" && n.username != "" && n.password != "" && n.from != "" && n.to != ""
}

func (n *EmailNotifier) NotifyNewOrder(order *models.Order, items []models.OrderItem) error {
	if !n.Enabled() {
		return nil
	}

	var body strings.Builder
	fmt.Fprintf(&body, "Có order mới: %s\n\n", order.OrderCode)
	fmt.Fprintf(&body, "Khách hàng: %s\n", order.CustomerName)
	fmt.Fprintf(&body, "Facebook/Zalo: %s\n", order.Contact)
	fmt.Fprintf(&body, "Số điện thoại: %s\n", order.Phone)
	fmt.Fprintf(&body, "Ghi chú: %s\n\n", order.Note)
	body.WriteString("Vật phẩm:\n")
	for _, item := range items {
		fmt.Fprintf(&body, "- %s x%d\n", item.ProductName, item.Quantity)
	}

	message := "From: " + n.from + "\r\n" +
		"To: " + n.to + "\r\n" +
		"Subject: [Hay Day Order] Order mới " + order.OrderCode + "\r\n" +
		"Content-Type: text/plain; charset=UTF-8\r\n\r\n" + body.String()
	port, err := strconv.Atoi(n.port)
	if err != nil || port <= 0 {
		return fmt.Errorf("SMTP port không hợp lệ: %s", n.port)
	}
	auth := smtp.PlainAuth("", n.username, n.password, n.host)
	return smtp.SendMail(fmt.Sprintf("%s:%d", n.host, port), auth, n.from, []string{n.to}, []byte(message))
}
