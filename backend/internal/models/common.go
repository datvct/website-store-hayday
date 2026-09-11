package models

import "time"

type Status string

const (
	OrderStatusNew            Status = "New"
	OrderStatusPendingPayment Status = "PendingPayment"
	OrderStatusPaid           Status = "Paid"
	OrderStatusInProduction   Status = "InProduction"
	OrderStatusCompleted      Status = "Completed"
	OrderStatusCancelled      Status = "Cancelled"
)

type BaseModel struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
