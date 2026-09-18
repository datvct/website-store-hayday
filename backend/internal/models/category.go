package models

type Category struct {
	BaseModel
	Name     string `gorm:"column:name;size:120;uniqueIndex;not null" json:"name"`
	IsActive bool   `gorm:"column:is_active;default:true;index" json:"isActive"`
}

func (Category) TableName() string {
	return "categories"
}
