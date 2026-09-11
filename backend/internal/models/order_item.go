package models

type OrderItem struct {
	BaseModel
	OrderID     uint   `gorm:"column:order_id;not null;index" json:"orderId"`
	ProductID   uint   `gorm:"column:product_id;not null;index" json:"productId"`
	ProductName string `gorm:"column:product_name;size:255;not null" json:"productName"`
	Quantity    int    `gorm:"column:quantity;not null" json:"quantity"`
	UnitPrice   int64  `gorm:"column:unit_price;not null" json:"-"`
	LineTotal   int64  `gorm:"column:line_total;not null" json:"-"`
}

func (OrderItem) TableName() string {
	return "order_items"
}
