package models

type AdminUser struct {
	BaseModel
	Username     string `gorm:"column:username;size:80;uniqueIndex;not null" json:"username"`
	PasswordHash string `gorm:"column:password_hash;size:255;not null" json:"-"`
	Role         string `gorm:"column:role;size:40;not null;default:'admin'" json:"role"`
}

func (AdminUser) TableName() string {
	return "admin_users"
}
