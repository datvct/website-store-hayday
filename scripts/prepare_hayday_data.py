#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "database.json"
TARGET_VI = ROOT / "database_vi.json"
TARGET_PRODUCTS_JSON = ROOT / "backend" / "seeds" / "products.json"
TARGET_SQL = ROOT / "backend" / "seeds" / "products.seed.sql"


PHRASE_OVERRIDES = {
    "Affogato": "Kem affogato",
    "Bacon Fries": "Khoai tây chiên thịt xông khói",
    "Banana Split": "Kem chuối sundae",
    "Birthday Bouquet": "Bó hoa sinh nhật",
    "Black Bean": "Đậu đen",
    "Black Sesame Smoothie": "Sinh tố mè đen",
    "Blackberry": "Mâm xôi đen",
    "Blackberry Jam": "Mứt mâm xôi đen",
    "Blackberry Muffin": "Bánh muffin mâm xôi đen",
    "Blueberries": "Việt quất",
    "Blueberry Cheesecake": "Bánh cheesecake việt quất",
    "Blueberry Chutney": "Xốt trái cây việt quất",
    "Blueberry Muffin": "Bánh muffin việt quất",
    "Blueberry Waffles": "Bánh waffle việt quất",
    "Bell Pepper": "Ớt chuông",
    "Bell Pepper Soup": "Súp ớt chuông",
    "Bracelet": "Vòng tay",
    "Bowl": "Tô",
    "Bright Bouquet": "Bó hoa rực rỡ",
    "Brown Sugar": "Đường nâu",
    "Butter": "Bơ",
    "Buttered Popcorn": "Bắp rang bơ",
    "Cabbage Soup": "Súp bắp cải",
    "Calming Diffuser": "Máy khuếch tán thư giãn",
    "Candy Bouquet": "Bó hoa kẹo",
    "Caramel Apple": "Táo caramel",
    "Caramel Latte": "Latte caramel",
    "Carrot Cake": "Bánh cà rốt",
    "Carrot Juice": "Nước ép cà rốt",
    "Carrot Pie": "Bánh nướng cà rốt",
    "Chamomile Essential Oil": "Tinh dầu cúc la mã",
    "Chamomile Tea": "Trà cúc la mã",
    "Cheese Omelet": "Trứng ốp la phô mai",
    "Cheesecake": "Bánh cheesecake",
    "Cherry Juice": "Nước ép anh đào",
    "Cherry Popsicle": "Kem que anh đào",
    "Chili Popcorn": "Bắp rang ớt",
    "Chocolate Cake": "Bánh sô cô la",
    "Chocolate Pie": "Bánh nướng sô cô la",
    "Chocolate Waffles": "Bánh waffle sô cô la",
    "Cocoa Smoothie": "Sinh tố cacao",
    "Colorful Candles": "Nến nhiều màu",
    "Colourful Omelet": "Trứng ốp la nhiều màu",
    "Corn Bread": "Bánh mì ngô",
    "Cream Cake": "Bánh kem",
    "Cream Donut": "Bánh donut kem",
    "Crunchy Donut": "Bánh donut giòn",
    "Cucumber Smoothie": "Sinh tố dưa chuột",
    "Dash": "Dash",
    "Duck Trap": "Bẫy vịt",
    "Feta Pie": "Bánh nướng feta",
    "Feta Salad": "Salad feta",
    "Filled Donut": "Bánh donut nhân",
    "Fish Burger": "Burger cá",
    "Fish Fillet": "Phi lê cá",
    "Fish Pie": "Bánh nướng cá",
    "Fish Skewer": "Xiên cá",
    "Fish Soup": "Súp cá",
    "Fish Taco": "Taco cá",
    "Fruit Cake": "Bánh trái cây",
    "Fruit Salad": "Salad trái cây",
    "Garlic Bread": "Bánh mì tỏi",
    "Grape Juice": "Nước ép nho",
    "Green Tea": "Trà xanh",
    "Guava Juice": "Nước ép ổi",
    "Honey Popcorn": "Bắp rang mật ong",
    "Honey Toast": "Bánh mì nướng mật ong",
    "Honey Apple Cake": "Bánh táo mật ong",
    "Honey Peanuts": "Đậu phộng mật ong",
    "Iced Latte": "Latte đá",
    "Iced Coffee": "Cà phê đá",
    "Orange Juice": "Nước ép cam",
    "Peach Pie": "Bánh nướng đào",
    "Pineapple Juice": "Nước ép dứa",
    "Raspberry Jam": "Mứt mâm xôi",
    "Raspberry Muffin": "Bánh muffin mâm xôi",
    "Raspberry Waffles": "Bánh waffle mâm xôi",
    "Strawberry Cake": "Bánh dâu tây",
    "Strawberry Cheesecake": "Bánh cheesecake dâu tây",
    "Strawberry Ice Cream": "Kem dâu tây",
    "Strawberry Juice": "Nước ép dâu tây",
    "Strawberry Muffin": "Bánh muffin dâu tây",
    "Sweet Popcorn": "Bắp rang ngọt",
    "Tropical Smoothie": "Sinh tố nhiệt đới",
    "Veggie Burger": "Burger rau củ",
    "Watermelon Juice": "Nước ép dưa hấu",
    "BLT": "BLT",
    "Bacon and Eggs": "Thịt xông khói và trứng",
    "Fish and Chips": "Cá và khoai tây chiên",
    "Caffe Latte": "Cà phê latte",
    "Caffè Latte": "Cà phê latte",
    "Caffe Mocha": "Cà phê mocha",
    "Caffè Mocha": "Cà phê mocha",
    "Colourful Omelet": "Trứng ốp la nhiều màu",
    "Colorful Candles": "Nến nhiều màu",
    "Blue Woolly Hat": "Mũ len xanh",
    "Blue Sweater": "Áo len xanh",
    "Blue Lure": "Mồi câu xanh",
    "Green Lure": "Mồi câu xanh lá",
    "Gold Lure": "Mồi câu vàng",
    "Red Lure": "Mồi câu đỏ",
    "Chili Popcorn": "Bắp rang ớt",
    "Honey Popcorn": "Bắp rang mật ong",
    "Chicken Feed": "Thức ăn gà",
    "Cow Feed": "Thức ăn bò",
    "Goat Feed": "Thức ăn dê",
    "Duck Trap": "Bẫy vịt",
    "Duck Feather": "Lông vịt",
    "Fishing Net": "Lưới câu cá",
    "Gold Ore": "Quặng vàng",
    "Iron Ore": "Quặng sắt",
    "Coal": "Than",
    "Clay": "Đất sét",
    "Cacao": "Ca cao",
    "Coconut": "Dừa",
    "Berries": "Quả mọng",
    "Broccoli Pasta": "Pasta bông cải xanh",
    "Broccoli Soup": "Súp bông cải xanh",
}


TOKEN_MAP = {
    "Apple": "Táo",
    "Affogato": "Affogato",
    "Asparagus": "Măng tây",
    "Bacon": "Thịt xông khói",
    "Baked": "Nướng",
    "Banana": "Chuối",
    "Bean": "Đậu",
    "Beeswax": "Sáp ong",
    "Beetroot": "Củ dền",
    "Bell": "Chuông",
    "Berry": "Quả mọng",
    "Black": "Đen",
    "Blanket": "Chăn",
    "Blue": "Xanh dương",
    "Brown": "Nâu",
    "Bread": "Bánh mì",
    "Breakfast": "Bữa sáng",
    "Bright": "Rực rỡ",
    "Broccoli": "Súp lơ xanh",
    "Butter": "Bơ",
    "Buttered": "Bơ",
    "Cabbage": "Bắp cải",
    "Cake": "Bánh",
    "Calming": "Thư giãn",
    "Candy": "Kẹo",
    "Canned": "Đóng hộp",
    "Caramel": "Caramel",
    "Carrot": "Cà rốt",
    "Casserole": "Món hầm",
    "Chamomile": "Cúc la mã",
    "Cheese": "Phô mai",
    "Cherry": "Anh đào",
    "Chicken": "Gà",
    "Chickpea": "Đậu gà",
    "Chili": "Ớt",
    "Chocolate": "Sô cô la",
    "Clay": "Đất sét",
    "Cocoa": "Ca cao",
    "Coffee": "Cà phê",
    "Coleslaw": "Salad bắp cải",
    "Colorful": "Nhiều màu",
    "Colourful": "Nhiều màu",
    "Cookie": "Bánh quy",
    "Corn": "Ngô",
    "Cotton": "Bông",
    "Cow": "Bò",
    "Cream": "Kem",
    "Crunchy": "Giòn",
    "Cucumber": "Dưa chuột",
    "Diamond": "Kim cương",
    "Dried": "Sấy",
    "Donut": "Bánh donut",
    "Duck": "Vịt",
    "Egg": "Trứng",
    "Eggplant": "Cà tím",
    "Espresso": "Espresso",
    "Fancy": "Sang trọng",
    "Falafel": "Falafel",
    "Feed": "Thức ăn",
    "Filled": "Nhân",
    "Fish": "Cá",
    "Floral": "Hoa",
    "Flower": "Hoa",
    "Fresh": "Tươi",
    "Fried": "Chiên",
    "Fruit": "Trái cây",
    "Fruity": "Vị trái cây",
    "Garlic": "Tỏi",
    "Ginger": "Gừng",
    "Gnocchi": "Gnocchi",
    "Goat": "Dê",
    "Gold": "Vàng",
    "Goods": "Hàng hóa",
    "Grape": "Nho",
    "Grapes": "Nho",
    "Green": "Xanh lá",
    "Grilled": "Nướng",
    "Guava": "Ổi",
    "Hamburger": "Hamburger",
    "Hand": "Tay",
    "Hat": "Mũ",
    "Honey": "Mật ong",
    "Hot": "Nóng",
    "Hummus": "Hummus",
    "Ice": "Kem",
    "Iced": "Đá",
    "Iron": "Sắt",
    "Jam": "Mứt",
    "Jelly": "Thạch",
    "Lamb": "Cừu non",
    "Latte": "Latte",
    "Lemon": "Chanh",
    "Lobster": "Tôm hùm",
    "Lure": "Mồi câu",
    "Mango": "Xoài",
    "Milk": "Sữa",
    "Milkshake": "Sinh tố sữa",
    "Mint": "Bạc hà",
    "Mug": "Cốc",
    "Muffin": "Bánh muffin",
    "Mushroom": "Nấm",
    "Noodles": "Mì",
    "Oil": "Dầu",
    "Olive": "Ô liu",
    "Orange": "Cam",
    "Omelet": "Trứng ốp la",
    "Pancakes": "Bánh kếp",
    "Peach": "Đào",
    "Peanut": "Đậu phộng",
    "Pepper": "Ớt",
    "Pie": "Bánh nướng",
    "Pineapple": "Dứa",
    "Plain": "Trơn",
    "Popcorn": "Bắp rang",
    "Potato": "Khoai tây",
    "Porridge": "Cháo",
    "Popsicle": "Kem que",
    "Quiche": "Quiche",
    "Raspberry": "Mâm xôi",
    "Rice": "Cơm",
    "Roll": "Cuộn",
    "Salad": "Salad",
    "Sandwich": "Bánh mì kẹp",
    "Sesame": "Mè",
    "Shawl": "Khăn choàng",
    "Smoothie": "Sinh tố",
    "Soap": "Xà phòng",
    "Soup": "Súp",
    "Spicy": "Cay",
    "Stew": "Hầm",
    "Sugar": "Đường",
    "Sushi": "Sushi",
    "Sweater": "Áo len",
    "Taco": "Taco",
    "Tea": "Trà",
    "Toast": "Bánh mì nướng",
    "Tofu": "Đậu phụ",
    "Tomato": "Cà chua",
    "Trap": "Bẫy",
    "Tropical": "Nhiệt đới",
    "Vanilla": "Vani",
    "Veggie": "Rau củ",
    "Waffles": "Bánh waffle",
    "Watermelon": "Dưa hấu",
    "Wheat": "Lúa mì",
    "Winter": "Mùa đông",
    "Woolly": "Len",
    "Yogurt": "Sữa chua",
    "Zucchini": "Bí ngòi",
    "and": "và",
    "of": "của",
}


def normalize_title(title: str) -> str:
    title = title.removeprefix("File:")
    title = title.removesuffix(".png")
    return title.replace("_", " ").strip()


def split_words(title: str) -> list[str]:
    return [w for w in re.split(r"[^A-Za-zÀ-ỹ0-9]+", title) if w]


def sentence_case(text: str) -> str:
    words = text.split()
    cleaned = []
    for word in words:
      if word.isupper() or word.isdigit():
            cleaned.append(word)
      else:
            cleaned.append(word.lower())
    if cleaned:
        cleaned[0] = cleaned[0][:1].upper() + cleaned[0][1:]
    return " ".join(cleaned).strip()


def translate_phrase(title: str) -> str:
    title = normalize_title(title)
    if title in PHRASE_OVERRIDES:
        return PHRASE_OVERRIDES[title]

    # Common sentence patterns used by Hay Day item names.
    patterns = [
        (r"^(.+?) and (.+)$", lambda m: f"{translate_phrase(m.group(1))} và {translate_phrase(m.group(2))}"),
        (r"^Grilled (.+)$", lambda m: f"{translate_phrase(m.group(1))} nướng"),
        (r"^Fried (.+)$", lambda m: f"{translate_phrase(m.group(1))} chiên"),
        (r"^Baked (.+)$", lambda m: f"{translate_phrase(m.group(1))} nướng"),
        (r"^Fresh (.+)$", lambda m: f"Tươi {translate_phrase(m.group(1))}"),
        (r"^Iced (.+)$", lambda m: f"{translate_phrase(m.group(1))} đá"),
        (r"^Canned (.+)$", lambda m: f"{translate_phrase(m.group(1))} đóng hộp"),
        (r"^Filled Donut$", lambda m: "Bánh donut nhân"),
        (r"^Colorful Candles$", lambda m: "Nến nhiều màu"),
        (r"^Colourful Omelet$", lambda m: "Trứng ốp la nhiều màu"),
    ]
    for pattern, fn in patterns:
        m = re.match(pattern, title)
        if m:
            return fn(m)

    # Reorder suffix-based food phrases into natural Vietnamese.
    suffix_rules = [
        (" Juice", "nước ép"),
        (" Tea", "trà"),
        (" Smoothie", "sinh tố"),
        (" Cake", "bánh"),
        (" Pie", "bánh nướng"),
        (" Soup", "súp"),
        (" Salad", "salad"),
        (" Bread", "bánh mì"),
        (" Waffles", "bánh waffle"),
        (" Donut", "bánh donut"),
        (" Muffin", "bánh muffin"),
        (" Cupcake", "bánh cupcake"),
        (" Pancakes", "bánh kếp"),
        (" Popsicle", "kem que"),
        (" Fondue", "lẩu"),
        (" Toast", "bánh mì nướng"),
        (" Sandwich", "bánh mì kẹp"),
        (" Burger", "burger"),
        (" Sushi", "sushi"),
        (" Roll", "cuộn"),
        (" Taco", "taco"),
        (" Skewer", "xiên"),
        (" Stew", "món hầm"),
        (" Porridge", "cháo"),
        (" Omelet", "trứng ốp la"),
        (" Casserole", "món nướng"),
        (" Latte", "latte"),
        (" Mocha", "mocha"),
        (" Popcorn", "bắp rang"),
        (" Milkshake", "sinh tố sữa"),
        (" Pizza", "pizza"),
        (" Pasta", "mì pasta"),
        (" Jam", "mứt"),
        (" Jelly", "thạch"),
        (" Chutney", "xốt trái cây"),
        (" Compote", "mứt trái cây"),
        (" Compote", "mứt trái cây"),
        (" Fudge", "kẹo mềm"),
        (" Bar", "thanh"),
    ]
    for suffix, prefix in suffix_rules:
        if title.endswith(suffix):
            head = title[: -len(suffix)].strip()
            return f"{prefix} {translate_phrase(head)}".strip()

    words = split_words(title)
    translated = [TOKEN_MAP.get(word, word) for word in words]
    # Keep already Vietnamese names and acronyms readable.
    return sentence_case(" ".join(translated).strip())


def derive_category(title: str) -> str:
    raw = normalize_title(title).lower()
    if any(k in raw for k in ["feed", "ore", "clay", "coal", "wax", "lure", "net"]):
        return "Nguyên liệu"
    if any(k in raw for k in ["bouquet", "candle", "crown", "hat", "shawl", "sweater", "shirt", "mask", "diffuser", "soap", "bracelet", "pendant", "blanket"]):
        return "Thời trang"
    if any(k in raw for k in ["juice", "tea", "coffee", "latte", "mocha", "smoothie", "milkshake"]):
        return "Đồ uống"
    if any(k in raw for k in ["cake", "pie", "donut", "muffin", "cupcake", "waffles", "pancakes", "bread", "toast", "cookie", "cheesecake", "porridge", "popcorn", "chocolate", "fudge", "ice cream", "popsicle"]):
        return "Bánh ngọt"
    if any(k in raw for k in ["soup", "salad", "burger", "sandwich", "taco", "sushi", "pasta", "pizza", "stew", "omelet", "roll", "skewer", "fondue", "casserole", "rice", "noodles"]):
        return "Món ăn"
    if any(k in raw for k in ["egg", "milk", "cheese", "cream", "butter", "goat", "cow", "chicken"]):
        return "Sản phẩm chăn nuôi"
    return "Nông sản"


def derive_price(title: str, category: str) -> int:
    raw = normalize_title(title).lower()
    if category == "Nguyên liệu":
        return 1200
    if category == "Thời trang":
        return 5200
    if category == "Đồ uống":
        return 2800
    if category == "Bánh ngọt":
        return 1800
    if category == "Món ăn":
        return 2600
    if category == "Sản phẩm chăn nuôi":
        return 2200
    if any(k in raw for k in ["fruit", "berry", "apple", "banana", "orange", "grape", "mango", "peach", "pineapple", "watermelon", "cherry"]):
        return 900
    return 700


def to_product(page: dict, index: int) -> dict:
    title = normalize_title(page["title"])
    name = sentence_case(translate_phrase(title))
    category = derive_category(title)
    price = derive_price(title, category)
    image_url = page.get("imageinfo", [{}])[0].get("url", "")
    return {
        "sourceTitle": title,
        "name": name,
        "category": category,
        "description": f"Sản phẩm Hay Day: {name}.",
        "imageUrl": image_url,
        "price": price,
        "stockQuantity": 0,
        "unit": "item",
        "isActive": True,
        "sortOrder": index,
    }


def sql_escape(value: str) -> str:
    return value.replace("'", "''")


def main() -> None:
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    pages = list(source["query"]["pages"].values())

    products = [to_product(page, index + 1) for index, page in enumerate(pages)]

    # Rewrite the Vietnamese mirror in the same MediaWiki-like structure.
    vi = json.loads(SOURCE.read_text(encoding="utf-8"))
    for page, product in zip(vi["query"]["pages"].values(), products):
        page["title"] = product["name"]

    TARGET_VI.write_text(json.dumps(vi, ensure_ascii=False, indent=2), encoding="utf-8")

    TARGET_PRODUCTS_JSON.parent.mkdir(parents=True, exist_ok=True)
    TARGET_PRODUCTS_JSON.write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8")

    cols = [
        "source_title",
        "name",
        "category",
        "description",
        "image_url",
        "price",
        "stock_quantity",
        "unit",
        "is_active",
        "sort_order",
    ]
    values = []
    for product in products:
        values.append(
            "("
            + ", ".join(
                [
                    f"'{sql_escape(product['sourceTitle'])}'",
                    f"'{sql_escape(product['name'])}'",
                    f"'{sql_escape(product['category'])}'",
                    f"'{sql_escape(product['description'])}'",
                    f"'{sql_escape(product['imageUrl'])}'",
                    str(int(product["price"])),
                    str(int(product["stockQuantity"])),
                    f"'{sql_escape(product['unit'])}'",
                    "TRUE" if product["isActive"] else "FALSE",
                    str(int(product["sortOrder"])),
                ]
            )
            + ")"
        )

    TARGET_SQL.write_text(
        "INSERT INTO products ("
        + ", ".join(cols)
        + ")\nVALUES\n"
        + ",\n".join(values)
        + ";\n",
        encoding="utf-8",
    )

    print(f"Wrote {len(products)} products to {TARGET_VI}, {TARGET_PRODUCTS_JSON}, {TARGET_SQL}")


if __name__ == "__main__":
    main()
