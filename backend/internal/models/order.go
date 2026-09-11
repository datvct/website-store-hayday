package models

import "time"

type Order struct {
	BaseModel
	OrderCode          string     `gorm:"column:order_code;size:32;uniqueIndex;not null" json:"orderCode"`
	CustomerName       string     `gorm:"column:customer_name;size:255;not null" json:"customerName"`
	Contact            string     `gorm:"column:contact;size:255;not null" json:"contact"`
	Phone              string     `gorm:"column:phone;size:32;not null;index" json:"phone"`
	Note               string     `gorm:"column:note;type:text" json:"note"`
	TotalAmount        int64      `gorm:"column:total_amount;not null" json:"totalAmount"`
	Status             Status     `gorm:"column:status;size:32;index;not null" json:"status"`
	PaymentConfirmedAt *time.Time `gorm:"column:payment_confirmed_at" json:"paymentConfirmedAt,omitempty"`
	AdminNote          string     `gorm:"column:admin_note;type:text" json:"adminNote"`
	QRUrl              string     `gorm:"column:qr_url;type:text" json:"qrUrl"`
	PaymentContent     string     `gorm:"column:payment_content;size:255" json:"paymentContent"`
}

func (Order) TableName() string {
	return "orders"
}
