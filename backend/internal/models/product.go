package models

type Product struct {
	BaseModel
	SourceTitle   string `gorm:"column:source_title;size:255;not null" json:"sourceTitle"`
	Name          string `gorm:"column:name;size:255;not null;index" json:"name"`
	Category      string `gorm:"column:category;size:120;index" json:"category"`
	CategoryID    uint   `gorm:"column:category_id;index;not null;default:0" json:"categoryId"`
	Description   string `gorm:"column:description;type:text" json:"description"`
	ImageURL      string `gorm:"column:image_url;type:text" json:"imageUrl"`
	Price         int64  `gorm:"column:price;not null;default:0" json:"-"`
	StockQuantity int    `gorm:"column:stock_quantity;not null;default:0" json:"stockQuantity"`
	Unit          string `gorm:"column:unit;size:32;default:'item'" json:"unit"`
	IsActive      bool   `gorm:"column:is_active;default:true;index" json:"isActive"`
	SortOrder     int    `gorm:"column:sort_order;default:0;index" json:"sortOrder"`
}

func (Product) TableName() string {
	return "products"
}
