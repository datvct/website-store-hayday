package models

type Setting struct {
	BaseModel
	Key   string `gorm:"column:key;size:120;uniqueIndex;not null" json:"key"`
	Value string `gorm:"column:value;type:text" json:"value"`
}

func (Setting) TableName() string {
	return "settings"
}
