import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Button as AntButton,
  Card,
  Popconfirm,
  Drawer,
  Empty,
  Input,
  InputNumber,
  Menu,
  Modal,
  Pagination,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  AppstoreOutlined,
  BarChartOutlined,
  DashboardOutlined,
  DeleteOutlined,
  EditOutlined,
  InboxOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PictureOutlined,
  SaveOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useCartStore } from "./store/useCartStore";
import { useAuthStore } from "./store/useAuthStore";
import { productApi } from "./api/productApi";
import { orderApi } from "./api/orderApi";
import { authApi } from "./api/authApi";
import { API_BASE_URL } from "./api/client";

const money = new Intl.NumberFormat("vi-VN");
const quantityOf = (item) => {
  const quantity = Number(item?.quantity);
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0;
};
const totalQuantity = (items) => items.reduce((total, item) => total + quantityOf(item), 0);
const imageSrc = (item) =>
  item.imageUrl
    ? `${API_BASE_URL}/products/${item.id}/image${item.updatedAt ? `?v=${encodeURIComponent(item.updatedAt)}` : ""}`
    : "";
const DEFAULT_CATEGORIES = ["Nông sản", "Đồ uống", "Bánh ngọt", "Món ăn", "Nguyên liệu", "Thời trang", "Sản phẩm chăn nuôi"];

function App() {
  return (
    <Routes>
      <Route path="/" element={<StorefrontLayout />}>
        <Route index element={<HomePage />} />
        <Route path="create-order" element={<CreateOrderPage />} />
        <Route path="product/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="submit-order" element={<CheckoutPage />} />
        <Route path="track-order" element={<TrackOrderPage />} />
      </Route>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminShell />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function StorefrontLayout() {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);
  const count = useCartStore((state) =>
    totalQuantity(state.items),
  );
  useEffect(() => {
    if (!localStorage.getItem("hd_welcome_seen")) setShowWelcome(true);
  }, []);
  const closeWelcome = () => {
    localStorage.setItem("hd_welcome_seen", "1");
    setShowWelcome(false);
  };
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-[#e5e5d7]/90 bg-paper/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="flex items-center gap-3 bg-transparent p-0 text-left text-ink shadow-none hover:bg-transparent hover:shadow-none"
            onClick={() => navigate("/")}
          >
            <img
              className="h-11 w-11 shrink-0 rounded-2xl rounded-bl-md object-cover shadow-lg shadow-farm/20"
              src="/images/hayday.png"
              alt="Hay Day Order"
            />
            <span>
              <strong className="block font-display text-lg leading-none">
                Hay Day Order
              </strong>
              <small className="text-xs text-[#718078]">
                Đặt vật phẩm nhanh gọn
              </small>
            </span>
          </button>
          <nav className="flex items-center justify-between gap-1 text-xs font-bold text-[#718078] sm:gap-3 sm:text-sm">
            <a className="rounded-lg px-2 py-2 hover:text-farm-dark" href="/">
              Sản phẩm
            </a>
            <a
              className="rounded-lg px-2 py-2 hover:text-farm-dark"
              href="/track-order"
            >
              Tra cứu đơn
            </a>
            {/* <a
              className="rounded-lg px-2 py-2 hover:text-farm-dark"
              href="/admin/login"
            >
              Admin
            </a> */}
            <button
              className="rounded-xl bg-farm px-3 py-2 text-white shadow-none hover:bg-farm-dark"
              onClick={() => navigate("/cart")}
            >
              Giỏ hàng{" "}
              <span className="ml-1 rounded-full bg-wheat px-1.5 py-0.5 text-ink">
                {count}
              </span>
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-8">
        <Outlet />
      </main>
      {showWelcome ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#e5e5d7] bg-paper p-6 shadow-2xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-[.18em] text-orange">Thông báo từ shop</p>
            <h2 className="mt-2 font-display text-3xl font-black">Order item Hay Day dễ hơn</h2>
            <p className="mt-3 leading-7 text-[#718078]">Bạn cứ chọn vật phẩm và số lượng cần tìm, kể cả item đang hết tồn. Shop sẽ kiểm tra nguồn hàng, báo giá và liên hệ lại qua thông tin bạn để lại.</p>
            <div className="mt-5 rounded-2xl bg-mint p-4 text-sm font-bold leading-6 text-farm-dark">Ưu đãi khách mới: gửi đủ tên, số điện thoại và ghi chú để shop phản hồi nhanh hơn.</div>
            <div className="mt-6 flex gap-2"><button className="btn-primary flex-1" onClick={() => { closeWelcome(); navigate('/create-order'); }}>Tạo order</button><button className="btn-secondary" onClick={closeWelcome}>Xem sản phẩm</button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [state, setState] = useState({
    loading: true,
    error: "",
    items: [],
    categories: [],
  });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  useEffect(() => {
    let active = true;
    Promise.allSettled([
      productApi.listAll({ query, category }),
      productApi.categories(),
    ])
      .then(([productsResult, categoriesResult]) => {
        const products = productsResult.status === "fulfilled" ? productsResult.value : { items: [] };
        const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
        const categoryNames = (Array.isArray(categories) ? categories : categories?.items || [])
          .map((item) => typeof item === "string" ? item : item?.name)
          .filter(Boolean);
        if (active)
          setState({
            loading: false,
            error: productsResult.status === "rejected" ? productsResult.reason?.message || "Không thể tải sản phẩm" : "",
            items: products.items,
            categories: ["all", ...(categoryNames.length ? categoryNames : DEFAULT_CATEGORIES)],
          });
      })
    return () => {
      active = false;
    };
  }, [query, category]);

  return (
    <div className="space-y-7">
      <section className="grid gap-4 lg:grid-cols-[1.45fr_.75fr]">
        <div className="panel bg-gradient-to-br from-paper to-[#f1f6e9] p-6 sm:p-10">
          <p className="mb-2 text-xs font-black uppercase tracking-[.18em] text-orange">
            Hay Day item shop
          </p>
          <h1 className="max-w-2xl font-display text-4xl font-black leading-[.98] tracking-tight text-ink sm:text-6xl">
            Bạn cần item nào cho nông trại?
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-[#718078]">
            Chọn vật phẩm, điền số lượng và gửi order. Shop sẽ xác nhận lại
            nhanh qua kênh liên hệ của bạn.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              className="btn-primary"
              onClick={() => navigate("/create-order")}
            >
              Tạo order ngay <span className="ml-1">→</span>
            </button>
            <button
              className="btn-secondary"
              onClick={() =>
                document
                  .getElementById("available-items")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Xem vật phẩm
            </button>
          </div>
          <div className="mt-7 grid gap-2 sm:grid-cols-[1fr_190px]">
            <input
              className="field"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm tên vật phẩm..."
            />
            <select
              className="field"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {(state.categories.length ? state.categories : ["all"]).map(
                (item) => (
                  <option key={item} value={item}>
                    {item === "all" ? "Tất cả danh mục" : item}
                  </option>
                ),
              )}
            </select>
            {query || category !== "all" ? <button type="button" className="btn-secondary text-sm sm:col-span-2" onClick={() => { setQuery(""); setCategory("all"); }}>Xoá bộ lọc</button> : null}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-farm-dark to-farm p-6 text-white shadow-soft sm:p-8">
          <span className="absolute -bottom-8 -right-2 text-[9rem] leading-none text-white/10">
            ✦
          </span>
          <p className="relative text-xs font-black uppercase tracking-[.18em] text-wheat">
            Đặt hàng dễ dàng
          </p>
          <h2 className="relative mt-3 max-w-xs font-display text-3xl font-black leading-tight text-white">
            Một form, nhiều item, rõ từng số lượng.
          </h2>
          <p className="relative mt-3 max-w-xs leading-7 text-white/75">
            Bạn chỉ cần gửi vật phẩm và số lượng. Shop sẽ kiểm tra nguồn hàng,
            báo giá và liên hệ lại.
          </p>
        </div>
      </section>

      <section id="available-items" className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-xs font-black uppercase tracking-[.18em] text-orange">
              Catalog
            </p>
            <h2 className="font-display text-3xl font-black">
              Sản phẩm có sẵn
            </h2>
            <p className="mt-1 text-sm text-[#718078]">
              {state.items.length} vật phẩm đang hiển thị
            </p>
          </div>
          <button
            className="btn-secondary self-start sm:self-auto"
            onClick={() => navigate("/create-order")}
          >
            Chọn số lượng →
          </button>
        </div>
        {state.error ? <Notice type="error">{state.error}</Notice> : null}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {state.loading
            ? Array.from({ length: 10 }).map((_, index) => (
                <div
                  className="h-80 animate-pulse rounded-3xl bg-[#e9ede1]"
                  key={index}
                />
              ))
            : state.items.map((item) => (
                <ProductCard
                  item={item}
                  key={item.id}
                  onDetail={() => navigate(`/product/${item.id}`)}
                  onOrder={() => navigate("/create-order")}
                />
              ))}
        </div>
      </section>
    </div>
  );
}

function ProductCard({ item, onDetail, onOrder }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-[#e5e5d7] bg-paper shadow-soft transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-[#edf4df] to-[#fff3ce] p-3 sm:h-48">
        {imageSrc(item) ? (
          <img
            className="h-full w-full object-contain transition duration-300 group-hover:scale-110"
            src={imageSrc(item)}
            alt={item.name}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span className="font-display text-farm/50">Hay Day</span>
        )}
      </div>
      <div className="p-3 sm:p-4">
        {/* <div className="flex justify-between gap-2 text-[11px] font-bold text-[#718078]">
          <span className="truncate">{item.category}</span>
        </div> */}
        <h3 className="mt-2 h-12 font-display text-sm font-black leading-5 sm:text-base">
          {item.name}
        </h3>
        {/* <span
          className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-black ${item.stockQuantity ? "bg-mint text-farm-dark" : "bg-[#fbe9e5] text-danger"}`}
        >
          {item.stockQuantity ? `Tồn kho: ${item.stockQuantity}` : "Có thể đặt trước"}
        </span> */}
        <div className="mt-3 flex gap-1.5">
         <button
            className="btn-primary flex-1 px-2 py-2 text-xs"
            onClick={onOrder}
          >
            Đặt item
          </button>
          <button
            className="btn-secondary flex-1 px-2 py-2 text-xs"
            onClick={onDetail}
          >
            Chi tiết
          </button>
         
        </div>
      </div>
    </article>
  );
}

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const [state, setState] = useState({
    loading: true,
    product: null,
    error: "",
  });
  useEffect(() => {
    productApi
      .get(id)
      .then((product) => setState({ loading: false, product, error: "" }))
      .catch((error) =>
        setState({ loading: false, error: error.message, product: null }),
      );
  }, [id]);
  if (state.loading)
    return (
      <div className="panel p-8 text-center text-[#718078]">
        Đang tải vật phẩm...
      </div>
    );
  if (state.error)
    return (
      <div className="panel p-5">
        <Notice type="error">{state.error}</Notice>
      </div>
    );
  const product = state.product;
  return (
    <section className="panel grid gap-6 p-5 sm:grid-cols-[minmax(280px,420px)_1fr] sm:p-8">
      <div className="flex min-h-80 items-center justify-center rounded-2xl bg-gradient-to-br from-[#edf4df] to-[#fff3ce] p-5">
        {imageSrc(product) ? (
          <img
            className="max-h-96 w-full object-contain"
            src={imageSrc(product)}
            alt={product.name}
          />
        ) : (
          <span>Hay Day</span>
        )}
      </div>
      <div className="flex flex-col justify-center">
        <p className="text-xs font-black uppercase tracking-[.18em] text-orange">
          {product.category}
        </p>
        <h2 className="mt-2 font-display text-4xl font-black">
          {product.name}
        </h2>
        <p className="mt-4 leading-7 text-[#718078]">{product.description}</p>
        
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            className="btn-primary"
            onClick={() => addItem(product, 1)}
          >
            Thêm vào giỏ
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate("/create-order")}
          >
            Tạo order
          </button>
        </div>
      </div>
    </section>
  );
}

function CreateOrderPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    contact: "",
    note: "",
  });
  const [state, setState] = useState({
    loading: true,
    submitting: false,
    error: "",
    result: null,
  });
  useEffect(() => {
    Promise.all([productApi.listAll(), productApi.categories()])
      .then(([result, categoryResult]) => {
        setProducts(result.items || []);
        setCategories((Array.isArray(categoryResult) ? categoryResult : []).filter(Boolean));
      })
      .catch((error) => setState((prev) => ({ ...prev, error: error.message })))
      .finally(() => setState((prev) => ({ ...prev, loading: false })));
  }, []);
  const selected = products.filter((item) => Number(quantities[item.id]) > 0);
  const visible = products.filter((item) => {
    const matchesQuery = `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "all" || item.category === category;
    return matchesQuery && matchesCategory;
  });
  const submit = async (event) => {
    event.preventDefault();
    if (!selected.length)
      return setState((prev) => ({
        ...prev,
        error: "Hãy nhập số lượng ít nhất một vật phẩm.",
      }));
    setState((prev) => ({ ...prev, submitting: true, error: "" }));
    try {
      const result = await orderApi.create({
        ...form,
        items: selected.map((item) => ({
          productId: item.id,
          quantity: quantityOf({ quantity: quantities[item.id] }),
        })),
      });
      setState((prev) => ({ ...prev, result, submitting: false }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        submitting: false,
      }));
    }
  };
  if (state.result?.order)
    return (
      <section className="panel mx-auto max-w-xl p-6 text-center sm:p-10">
        <p className="text-xs font-black uppercase tracking-[.18em] text-orange">
          Order đã được tạo
        </p>
        <h2 className="mt-2 font-display text-3xl font-black">
          {state.result.order.orderCode}
        </h2>
        <Notice type="success">
          Shop đã nhận thông tin. Shop sẽ kiểm tra nguồn hàng, báo giá và liên hệ
          lại qua số điện thoại hoặc kênh liên lạc bạn đã để lại.
        </Notice>
        <div className="flex justify-center gap-2">
          <button
            className="btn-primary"
            onClick={() => navigate("/track-order")}
          >
            Tra cứu order
          </button>
          <button className="btn-secondary" onClick={() => navigate("/")}>
            Trang chủ
          </button>
        </div>
      </section>
    );
  return (
    <section className="panel mx-auto max-w-5xl p-4 sm:p-7">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-orange">
            Tạo order
          </p>
          <h2 className="mt-1 font-display text-3xl font-black">
            Chọn vật phẩm và nhập số lượng
          </h2>
          <p className="mt-1 text-sm text-[#718078]">
            Không cần thêm giỏ, nhập trực tiếp vào danh sách bên dưới.
          </p>
        </div>
        <button
          className="btn-secondary self-start"
          onClick={() => navigate("/")}
        >
          Quay lại
        </button>
      </div>
      {state.error ? <Notice type="error">{state.error}</Notice> : null}
      {state.loading ? (
        <div className="py-10 text-center text-[#718078]">
          Đang tải danh sách...
        </div>
      ) : (
        <form onSubmit={submit}>
          {showCustomerForm ? (
            <div className="mt-6 rounded-2xl border border-[#e4e9dc] bg-[#f7fbf3] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <strong className="text-farm-dark">Thông tin người đặt</strong>
                <button type="button" className="text-sm font-bold text-farm underline" onClick={() => setShowCustomerForm(false)}>
                  Đổi item
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input className="field" required placeholder="Tên khách hàng" value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} />
                <input className="field" placeholder="Số điện thoại (không bắt buộc)" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                <input className="field" required placeholder="Facebook/Zalo (bắt buộc)" value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} />
                <textarea className="field" placeholder="Ghi chú order" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
              </div>
            </div>
          ) : null}
          <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_240px_auto] sm:items-center">
            <input
              className="field"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm nhanh vật phẩm..."
            />
            <select
              className="field"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">Tất cả máy sản xuất</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <span className="text-sm font-bold text-farm-dark">
              Đã chọn {selected.length} loại
            </span>
          </div>
          <div className="mt-3 grid max-h-[620px] gap-2 overflow-auto pr-1">
            {visible.map((item) => (
              <div
                className="grid grid-cols-[48px_1fr_74px] items-center gap-3 rounded-2xl border border-[#e4e9dc] bg-paper p-2 sm:grid-cols-[58px_1fr_90px] sm:p-2.5"
                key={item.id}
              >
                <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#edf4df] to-[#fff3ce] sm:h-14 sm:w-14">
                  {imageSrc(item) ? (
                    <img
                      className="h-full w-full object-contain"
                      src={imageSrc(item)}
                      alt={item.name}
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-xs font-black text-farm">HD</span>
                  )}
                </div>
                <div className="min-w-0">
                  <strong className="block truncate text-sm">
                    {item.name}
                  </strong>
                  <span className="block truncate text-xs text-[#718078]">
                    {item.category}
                  </span>
                </div>
                <input
                  className="field w-[74px] px-2 text-center font-bold sm:w-[90px]"
                  type="number"
                  min="0"
                  placeholder="SL"
                  value={quantities[item.id] || ""}
                  onChange={(event) =>
                    setQuantities({
                      ...quantities,
                      [item.id]: event.target.value,
                    })
                  }
                />
              </div>
            ))}
            {!visible.length ? <Notice>Không tìm thấy vật phẩm.</Notice> : null}
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-[#e5e5d7] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-sm text-[#718078]">Đã chọn {selected.length} loại vật phẩm</span>
              <strong className="ml-3 font-display text-lg text-farm-dark">Shop sẽ báo giá sau</strong>
            </div>
            {showCustomerForm ? (
              <button className="btn-primary" disabled={state.submitting}>
                {state.submitting ? "Đang tạo order..." : "Gửi order"}
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={() => selected.length
                  ? navigate("/submit-order", {
                      state: {
                        items: selected.map((item) => ({
                          ...item,
                          quantity: quantityOf({ quantity: quantities[item.id] }),
                        })),
                      },
                    })
                  : setState((prev) => ({ ...prev, error: "Hãy nhập số lượng ít nhất một vật phẩm." }))}
              >
                Tiếp tục nhập thông tin
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQty } = useCartStore();
  return (
    <section className="panel p-5">
      <Header
        title="Giỏ hàng"
        action="Tiếp tục mua"
        onAction={() => navigate("/")}
      />
      {!items.length ? (
        <Notice>Giỏ hàng đang trống.</Notice>
      ) : (
        <>
          <div className="overflow-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs uppercase text-[#718078]">
                <tr>
                  <th className="p-3">Sản phẩm</th>
                  <th className="p-3">Số lượng</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr className="border-t border-[#edf0e7]" key={item.id}>
                    <td className="p-3 font-bold">{item.name}</td>
                    <td className="p-3">
                      <input
                        className="field w-20 px-2"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) =>
                          updateQty(item.id, Number(event.target.value))
                        }
                      />
                    </td>
                    <td className="p-3">
                      <button
                        className="btn-secondary px-3 py-2 text-xs"
                        onClick={() => removeItem(item.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="btn-primary mt-4 w-full"
            onClick={() => navigate("/checkout")}
          >
            Tiếp tục đặt hàng
          </button>
        </>
      )}
    </section>
  );
}

function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const cartItems = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const directItems = location.state?.items;
  const items = Array.isArray(directItems) && directItems.length ? directItems : cartItems;
  const isDirectOrder = Array.isArray(directItems) && directItems.length > 0;
  const [form, setForm] = useState({
    customerName: "",
    contact: "",
    phone: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await orderApi.create({
        ...form,
        items: items.map((item) => ({
          productId: item.id,
          quantity: quantityOf(item),
        })),
      });
      setResult(result);
      if (!isDirectOrder) clear();
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };
  if (result?.order)
    return (
      <section className="panel mx-auto max-w-xl p-6 text-center">
        <h2 className="font-display text-3xl font-black">
          Đặt hàng thành công
        </h2>
        <Notice type="success">Mã đơn: {result.order.orderCode}. Shop sẽ liên hệ lại để báo giá và xác nhận order.</Notice>
        <button
          className="btn-primary"
          onClick={() => navigate("/track-order")}
        >
          Tra cứu đơn
        </button>
      </section>
    );
  if (!items.length)
    return (
      <section className="panel mx-auto max-w-xl p-6 text-center sm:p-8">
        <h2 className="font-display text-3xl font-black">Giỏ hàng đang trống</h2>
        <Notice>Hãy chọn ít nhất một vật phẩm trước khi đặt hàng.</Notice>
        <button className="btn-primary" onClick={() => navigate("/")}>Xem sản phẩm</button>
      </section>
    );
  return (
    <section className="panel mx-auto max-w-2xl p-5">
      <Header
        title="Thông tin nhận order"
        action="Quay lại"
        onAction={() => navigate(isDirectOrder ? "/create-order" : "/cart")}
      />
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={submit}>
        <input
          className="field"
          required
          placeholder="Tên khách hàng"
          value={form.customerName}
          onChange={(event) =>
            setForm({ ...form, customerName: event.target.value })
          }
        />
        <input
          className="field"
          required
          placeholder="Số điện thoại (không bắt buộc)"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />
        <input
          className="field"
          placeholder="Facebook/Zalo (bắt buộc)"
          required
          value={form.contact}
          onChange={(event) =>
            setForm({ ...form, contact: event.target.value })
          }
        />
        <textarea
          className="field"
          placeholder="Ghi chú"
          value={form.note}
          onChange={(event) => setForm({ ...form, note: event.target.value })}
        />
        <div className="sm:col-span-2">
          <button
            className="btn-primary w-full"
            disabled={loading || !items.length}
          >
            {loading ? "Đang tạo đơn..." : "Xác nhận đặt hàng"}
          </button>
        </div>
      </form>
      <div className="mt-5 rounded-2xl border border-[#e4e9dc] bg-[#f7fbf3] p-4">
        <div className="mb-2 flex items-center justify-between text-sm font-black text-farm-dark">
          <span>Item khách đã chọn</span>
          <span>Tổng: {totalQuantity(items)} sản phẩm</span>
        </div>
        <div className="grid gap-2 text-sm">
          {items.map((item) => (
            <div className="flex justify-between gap-3 border-b border-white py-1 last:border-0" key={item.id}>
              <span className="truncate">{item.name}</span>
              <strong className="shrink-0">Số lượng: {quantityOf(item)}</strong>
            </div>
          ))}
        </div>
      </div>
      {result?.error ? <Notice type="error">{result.error}</Notice> : null}
    </section>
  );
}

function TrackOrderPage() {
  const [form, setForm] = useState({ orderCode: "", contact: "" });
  const [result, setResult] = useState(null);
  const submit = async (event) => {
    event.preventDefault();
    try {
      setResult(await orderApi.track(form));
    } catch (error) {
      setResult({ error: error.message });
    }
  };
  return (
    <section className="panel mx-auto max-w-2xl p-5">
      <p className="text-xs font-black uppercase tracking-[.18em] text-orange">
        Theo dõi tiến độ
      </p>
      <h2 className="mt-1 font-display text-3xl font-black">Tra cứu order</h2>
      <p className="mt-2 text-sm text-[#718078]">
        Nhập mã đơn và thông tin Facebook/Zalo đã dùng khi đặt hàng.
      </p>
      <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
        <input
          className="field"
          required
          placeholder="Mã đơn, ví dụ HD-20260910-001"
          value={form.orderCode}
          onChange={(event) =>
            setForm({ ...form, orderCode: event.target.value })
          }
        />
        <input
          className="field"
          required
          placeholder="Facebook/Zalo"
          value={form.contact}
          onChange={(event) => setForm({ ...form, contact: event.target.value })}
        />
        <button className="btn-primary sm:col-span-2">Tra cứu</button>
      </form>
      {result?.error ? <Notice type="error">{result.error}</Notice> : null}
      {result?.order ? (
        <div className="mt-5 rounded-2xl bg-mint p-4">
          <div className="flex justify-between">
            <strong>{result.order.orderCode}</strong>
            <span className="font-bold text-farm-dark">
              {result.order.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#718078]">
            Shop sẽ liên hệ để báo giá và xác nhận số lượng.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function Header({ title, action, onAction }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="font-display text-3xl font-black">{title}</h2>
      {action ? (
        <button className="btn-secondary text-sm" onClick={onAction}>
          {action}
        </button>
      ) : null}
    </div>
  );
}
function Notice({ children, type = "normal" }) {
  const style =
    type === "error"
      ? "border-[#ebc0b8] bg-[#fff1ed] text-danger"
      : type === "success"
        ? "border-[#b9d5b8] bg-[#eef8ec] text-farm-dark"
        : "border-[#e5e5d7] bg-paper text-[#718078]";
  return (
    <div className={`my-4 rounded-2xl border p-3 text-sm ${style}`}>
      {children}
    </div>
  );
}

function AdminLoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    try {
      const result = await authApi.login(form);
      setAuth(result.token, result.admin);
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <main className="grid min-h-screen place-items-center bg-cream p-4">
      <section className="panel w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 text-center">
          <img
            className="mx-auto h-14 w-14 rounded-2xl object-cover"
            src="/images/hayday.png"
            alt="Hay Day Order"
          />
          <h1 className="mt-4 font-display text-3xl font-black">Chào admin</h1>
          <p className="mt-1 text-sm text-[#718078]">
            Quản lý item và order Hay Day
          </p>
        </div>
        <form className="grid gap-3" onSubmit={submit}>
          <input
            className="field"
            required
            placeholder="Tên đăng nhập"
            value={form.username}
            onChange={(event) =>
              setForm({ ...form, username: event.target.value })
            }
          />
          <input
            className="field"
            required
            type="password"
            placeholder="Mật khẩu"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
          />
          <button className="btn-primary mt-2">Đăng nhập</button>
        </form>
        {error ? <Notice type="error">{error}</Notice> : null}
      </section>
    </main>
  );
}
function ProtectedRoute({ children }) {
  return useAuthStore((state) => state.token) ? (
    children
  ) : (
    <Navigate to="/admin/login" replace />
  );
}

function AdminShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const selectedKey = location.pathname.includes("categories")
    ? "/admin/categories"
    : location.pathname.includes("products")
    ? "/admin/products"
    : location.pathname.includes("orders") || location.pathname.includes("order")
      ? "/admin/orders"
      : location.pathname.includes("stats")
        ? "/admin/stats"
        : "/admin";

  const logout = () => {
    clearAuth();
    navigate("/admin/login");
  };

  const menuItems = [
    { key: "/admin", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/admin/products", icon: <AppstoreOutlined />, label: "Sản phẩm & tồn kho" },
    { key: "/admin/categories", icon: <AppstoreOutlined />, label: "Danh mục" },
    { key: "/admin/orders", icon: <ShoppingCartOutlined />, label: "Đơn hàng" },
    { key: "/admin/stats", icon: <BarChartOutlined />, label: "Thống kê" },
  ];

  const handleNavigate = ({ key }) => {
    navigate(key);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#f6f8f2]">
      <aside className={`hidden shrink-0 flex-col bg-[#173d2b] text-white transition-[width] duration-200 md:flex ${collapsed ? "w-[76px]" : "w-64"}`}>
        <div className="flex h-16 shrink-0 items-center justify-center gap-2 border-b border-white/10 px-3">
          <img className="h-9 w-9 shrink-0 rounded-xl object-cover" src="/images/hayday.png" alt="Hay Day" />
          {!collapsed ? <span className="font-display text-lg font-black">Hay Day Admin</span> : null}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} onClick={handleNavigate} items={menuItems} className="!border-0 !bg-transparent !pt-3" />
        <div className="mt-auto p-3 text-center text-[11px] text-white/45">{collapsed ? "HD" : "Quản trị cửa hàng"}</div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e3e9df] bg-white px-3 shadow-sm sm:px-6">
          <AntButton
            type="text"
            aria-label="Thu gọn menu"
            className="!flex md:!hidden"
            icon={<MenuUnfoldOutlined />}
            onClick={() => setMobileMenuOpen(true)}
          />
          <AntButton
            type="text"
            aria-label="Thu gọn menu desktop"
            className="!hidden md:!flex"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((value) => !value)}
          />
          <Space size="middle">
            <div className="hidden text-right sm:block">
              <strong className="block text-sm text-[#173d2b]">Quản trị viên</strong>
              <span className="text-xs text-[#718078]">Hay Day Order</span>
            </div>
            <Avatar icon={<UserOutlined />} className="!bg-[#4b8f4a]" />
            <Tooltip title="Đăng xuất">
              <AntButton type="text" danger icon={<LogoutOutlined />} onClick={logout} />
            </Tooltip>
          </Space>
        </header>
        <div className="min-w-0 overflow-x-hidden p-3 sm:p-6">
          <Routes>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="order" element={<Navigate to="/admin/orders" replace />} />
            <Route path="stats" element={<AdminStatsPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
      <Drawer title="Hay Day Admin" placement="left" width={280} open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} styles={{ body: { padding: 0 } }}>
        <Menu mode="inline" selectedKeys={[selectedKey]} onClick={handleNavigate} items={menuItems} />
      </Drawer>
    </div>
  );
}
function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    orderApi
      .adminStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);
  return (
    <section className="space-y-5">
      <Header title="Dashboard" />
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Tổng order" value={stats?.totalOrders ?? 0} />
        <StatCard
          label="Doanh thu"
          value={`${money.format(stats?.totalRevenue ?? 0)} đ`}
        />
      </div>
      <div className="panel p-5">
        <h3 className="font-display text-xl font-black">Bắt đầu nhanh</h3>
        <p className="mt-1 text-sm text-[#718078]">
          Cập nhật tồn kho trước để khách có thể chọn số lượng khi tạo order.
        </p>
        <a className="btn-primary mt-4 inline-block" href="/admin/products">
          Cập nhật tồn kho
        </a>
      </div>
    </section>
  );
}
function StatCard({ label, value }) {
  return (
    <div className="panel p-5">
      <span className="text-sm text-[#718078]">{label}</span>
      <strong className="mt-1 block font-display text-3xl font-black text-farm-dark">
        {value}
      </strong>
    </div>
  );
}
function AdminProductsPage() {
  const [state, setState] = useState({ items: [], loading: true, page: 1, total: 0 });
  const [saving, setSaving] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createImage, setCreateImage] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [form, setForm] = useState({
    sourceTitle: "",
    name: "",
    category: "Nông sản",
    imageUrl: "",
    stockQuantity: 0,
  });
  const load = (page = 1, query = search, selectedCategory = category) => {
    setState((prev) => ({ ...prev, loading: true }));
    productApi
      .adminList({ page, limit: 20, query, categoryId: selectedCategory })
      .then((result) => setState({ items: result.items, loading: false, page, total: result.total }))
      .catch(() => setState({ items: [], loading: false, page, total: 0 }));
  };
  const loadCategories = () => productApi.adminCategories().then(setCategories).catch(() => setCategories([]));
  const categoryOptions = categories.length ? categories : DEFAULT_CATEGORIES.map((name) => ({ id: name, name }));
  const categoryNames = categoryOptions.map((item) => item.name);
  useEffect(() => { load(1, "", "all"); loadCategories(); }, []);
  const create = async () => {
    if (!form.name.trim() && !form.sourceTitle.trim()) {
      message.error("Vui lòng nhập tên sản phẩm.");
      return;
    }
    setCreateSaving(true);
    try {
      const created = await productApi.adminCreate({
        ...form,
        name: form.name.trim(),
        sourceTitle: form.sourceTitle.trim(),
        imageUrl: "",
        stockQuantity: Number(form.stockQuantity),
        sortOrder: state.total + 1,
        unit: "item",
        isActive: true,
        description: `Sản phẩm Hay Day: ${form.name || form.sourceTitle}.`,
      });
      if (createImage) {
        await productApi.adminUploadImage(created.id, createImage);
      }
      setForm({
        sourceTitle: "",
        name: "",
        category: "Nông sản",
        imageUrl: "",
        stockQuantity: 0,
      });
      setCreateImage(null);
      setCreateOpen(false);
      message.success("Đã thêm sản phẩm.");
      load();
    } catch (error) {
      message.error(error.message || "Không thể thêm sản phẩm.");
    } finally {
      setCreateSaving(false);
    }
  };
  const remove = async (item) => {
    setDeleting(item.id);
    try {
      await productApi.adminDelete(item.id);
      message.success(`Đã xoá ${item.name}.`);
      load(state.items.length === 1 && state.page > 1 ? state.page - 1 : state.page);
    } catch (error) {
      message.error(error.message || "Không thể xoá sản phẩm.");
    } finally {
      setDeleting(null);
    }
  };
  const saveEdit = async () => {
    if (!editing?.name.trim()) {
      message.error("Tên sản phẩm không được để trống.");
      return;
    }
    setEditSaving(true);
    try {
      await productApi.adminUpdate(editing.id, {
        name: editing.name.trim(),
        sourceTitle: editing.sourceTitle.trim(),
        category: editing.category,
        description: editing.description.trim(),
        stockQuantity: Number(editing.stockQuantity || 0),
        isActive: editing.isActive,
      });
      if (editingImage) {
        await productApi.adminUploadImage(editing.id, editingImage);
      }
      message.success("Đã cập nhật sản phẩm.");
      setEditing(null);
      setEditingImage(null);
      load(state.page);
    } catch (error) {
      message.error(error.message || "Không thể cập nhật sản phẩm.");
    } finally {
      setEditSaving(false);
    }
  };
  return (
    <section className="space-y-5">
      <Header title="Sản phẩm & tồn kho" />
      <Card bordered={false} className="!rounded-2xl !shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-black text-[#173d2b]">Tìm nhanh trong kho</h3>
            <p className="text-xs text-[#718078]">Tìm theo tên tiếng Việt hoặc tên gốc Hay Day.</p>
          </div>
          <Input.Search
            allowClear
            enterButton={<><SearchOutlined /> Tìm</>}
            placeholder="Ví dụ: Affogato, bánh..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onSearch={(value) => { setSearch(value); load(1, value, category); }}
            className="w-full sm:!max-w-md"
          />
          <Select
            showSearch
            optionFilterProp="label"
            value={category}
            onChange={(value) => { setCategory(value); load(1, search, value); }}
            className="w-full sm:!w-52"
            options={[{ id: "all", name: "Tất cả danh mục" }, ...categoryOptions].map((item) => ({
              value: String(item.id),
              label: item.name,
            }))}
          />
          {search || category !== "all" ? <AntButton onClick={() => { setSearch(""); setCategory("all"); load(1, "", "all"); }}>Xoá bộ lọc</AntButton> : null}
        </div>
      </Card>
      <div className="flex items-center justify-between rounded-2xl bg-[#eaf4e6] p-4">
        <div>
          <strong className="block text-[#173d2b]">Quản lý sản phẩm</strong>
          <span className="text-sm text-[#718078]">Tạo sản phẩm và upload ảnh trực tiếp lên MinIO.</span>
        </div>
        <AntButton type="primary" onClick={() => setCreateOpen(true)}>Tạo sản phẩm</AntButton>
      </div>
      <div className="panel overflow-hidden">
        <div className="hidden overflow-auto md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#f1f4eb] text-xs uppercase text-[#718078]">
              <tr>
                <th className="p-3">Ảnh</th>
                <th className="p-3">Sản phẩm</th>
                <th className="p-3">Danh mục</th>
                <th className="p-3">Tồn kho</th>
                <th className="p-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((item) => (
                <tr className="border-t border-[#edf0e7]" key={item.id}>
                  <td className="p-3">
                    {item.imageUrl ? <img className="h-12 w-12 rounded-xl bg-[#edf4df] object-contain" src={imageSrc(item)} alt={item.name} /> : <span className="text-xs font-black text-farm">HD</span>}
                  </td>
                  <td className="p-3 font-bold">{item.name}</td>
                  <td className="p-3 text-[#718078]">{item.category}</td>
                  <td className="p-3">
                    <input
                      className="field w-24 px-2"
                      type="number"
                      min="0"
                      value={item.stockQuantity || 0}
                      onChange={(event) =>
                        setState((prev) => ({
                          ...prev,
                          items: prev.items.map((current) =>
                            current.id === item.id
                              ? {
                                  ...current,
                                  stockQuantity: event.target.value,
                                }
                              : current,
                          ),
                        }))
                      }
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                    <AntButton size="small" icon={<EditOutlined />} onClick={() => { setEditing({ ...item, description: item.description || "" }); setEditingImage(null); }}>Sửa</AntButton>
                    <button
                      className="btn-secondary px-3 py-2 text-xs"
                      disabled={saving === item.id}
                      onClick={async () => {
                        setSaving(item.id);
                        await productApi.adminUpdate(item.id, {
                          stockQuantity: Number(item.stockQuantity),
                        });
                        setSaving(null);
                        load();
                      }}
                    >
                      {saving === item.id ? "Đang lưu..." : "Lưu tồn"}
                    </button>
                    <Popconfirm title="Xoá sản phẩm này?" description="Sản phẩm sẽ bị xoá khỏi danh sách quản lý." okText="Xoá" cancelText="Huỷ" okButtonProps={{ danger: true }} onConfirm={() => remove(item)}>
                      <AntButton danger size="small" icon={<DeleteOutlined />} loading={deleting === item.id}>Xoá</AntButton>
                    </Popconfirm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 p-3 md:hidden">
          {!state.items.length && !state.loading ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có sản phẩm" /> : null}
          {state.items.map((item) => (
            <div className="flex gap-3 rounded-2xl border border-[#e3e9df] bg-white p-3 shadow-sm" key={item.id}>
              {item.imageUrl ? <img className="h-16 w-16 shrink-0 rounded-xl bg-[#edf4df] object-contain" src={imageSrc(item)} alt={item.name} /> : <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-[#edf4df] font-black text-farm">HD</span>}
              <div className="min-w-0 flex-1">
                <strong className="block truncate text-[#173d2b]">{item.name}</strong>
                <span className="block text-xs text-[#718078]">{item.category}</span>
                <div className="mt-2 flex items-center gap-2">
                  <InputNumber className="!w-28" min={0} value={item.stockQuantity || 0} onChange={(value) => setState((prev) => ({ ...prev, items: prev.items.map((current) => current.id === item.id ? { ...current, stockQuantity: value || 0 } : current) }))} />
                  <div className="flex gap-2">
                    <AntButton size="small" icon={<EditOutlined />} onClick={() => { setEditing({ ...item, description: item.description || "" }); setEditingImage(null); }}>Sửa</AntButton>
                    <AntButton size="small" type="primary" icon={<SaveOutlined />} loading={saving === item.id} onClick={async () => { setSaving(item.id); try { await productApi.adminUpdate(item.id, { stockQuantity: Number(item.stockQuantity) }); message.success("Đã cập nhật tồn kho."); load(); } catch (error) { message.error(error.message || "Không thể cập nhật tồn kho."); } finally { setSaving(null); } }}>Lưu</AntButton>
                    <Popconfirm title="Xoá sản phẩm này?" okText="Xoá" cancelText="Huỷ" okButtonProps={{ danger: true }} onConfirm={() => remove(item)}>
                      <AntButton danger size="small" icon={<DeleteOutlined />} loading={deleting === item.id}>Xoá</AntButton>
                    </Popconfirm>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Modal title="Tạo sản phẩm" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={create} okText="Tạo sản phẩm" cancelText="Huỷ" confirmLoading={createSaving} width={560}>
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Tên hiển thị" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <Input placeholder="Source title" value={form.sourceTitle} onChange={(event) => setForm({ ...form, sourceTitle: event.target.value })} />
          </div>
          <Select showSearch optionFilterProp="label" value={form.category} onChange={(value) => setForm({ ...form, category: value })} options={categoryNames.map((value) => ({ value, label: value }))} />
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setCreateImage(event.target.files?.[0] || null)} />
          <InputNumber className="!w-full" min={0} addonAfter="tồn" value={form.stockQuantity} onChange={(value) => setForm({ ...form, stockQuantity: value || 0 })} />
        </div>
      </Modal>
      <Modal title="Chỉnh sửa sản phẩm" open={Boolean(editing)} onCancel={() => { setEditing(null); setEditingImage(null); }} onOk={saveEdit} okText="Lưu thay đổi" cancelText="Huỷ" confirmLoading={editSaving} width={560}>
        {editing ? <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Tên hiển thị" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} />
            <Input placeholder="Source title" value={editing.sourceTitle} onChange={(event) => setEditing({ ...editing, sourceTitle: event.target.value })} />
          </div>
          <Select showSearch optionFilterProp="label" value={editing.category} onChange={(value) => setEditing({ ...editing, category: value })} options={categoryNames.map((value) => ({ value, label: value }))} />
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setEditingImage(event.target.files?.[0] || null)} />
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#cbdacb] bg-[#f7fbf3] p-2">
            {editingImage ? <img className="h-14 w-14 rounded-lg object-contain" src={URL.createObjectURL(editingImage)} alt="Preview ảnh mới" /> : editing.imageUrl ? <img className="h-14 w-14 rounded-lg object-contain" src={imageSrc(editing)} alt="Ảnh hiện tại" /> : <PictureOutlined className="text-2xl text-[#718078]" />}
            <span className="text-xs text-[#718078]">{editingImage ? editingImage.name : "Ảnh hiện tại trên MinIO"}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InputNumber className="!w-full" min={0} addonAfter="tồn" value={editing.stockQuantity || 0} onChange={(value) => setEditing({ ...editing, stockQuantity: value || 0 })} />
            <Select value={editing.isActive !== false ? true : false} onChange={(value) => setEditing({ ...editing, isActive: value })} options={[{ value: true, label: "Đang hiển thị" }, { value: false, label: "Tạm ẩn" }]} />
          </div>
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} placeholder="Mô tả sản phẩm" value={editing.description || ""} onChange={(event) => setEditing({ ...editing, description: event.target.value })} />
        </div> : null}
      </Modal>
      <Pagination current={state.page} pageSize={20} total={state.total} showSizeChanger={false} onChange={(page) => load(page)} className="!my-4 !mr-2 !flex !justify-end" />
    </section>
  );
}
function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    productApi.adminCategories().then(setCategories).catch(() => setCategories([])).finally(() => setLoading(false));
  };
  useEffect(() => load(), []);

  const save = async () => {
    if (!modal?.name.trim()) {
      message.error("Tên danh mục không được để trống.");
      return;
    }
    setSaving(true);
    try {
      if (modal.id) {
        await productApi.adminUpdateCategory(modal.id, { name: modal.name.trim(), isActive: modal.isActive !== false });
      } else {
        await productApi.adminCreateCategory(modal.name.trim());
      }
      setModal(null);
      load();
      message.success("Đã lưu danh mục.");
    } catch (error) {
      message.error(error.message || "Không thể lưu danh mục.");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (item) => {
    try {
      await productApi.adminDeleteCategory(item.id);
      load();
      message.success("Đã xoá danh mục.");
    } catch (error) {
      message.error(error.message || "Không thể xoá danh mục.");
    }
  };

  return (
    <section className="space-y-5">
      <Header title="Danh mục máy sản xuất" />
      <Card bordered={false} className="!rounded-2xl !shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-black text-[#173d2b]">Quản lý danh mục</h3>
            <p className="text-sm text-[#718078]">Tạo danh mục riêng để dùng khi tạo sản phẩm và lọc danh sách.</p>
          </div>
          <AntButton type="primary" onClick={() => setModal({ name: "", isActive: true })}>Thêm danh mục</AntButton>
        </div>
      </Card>
      <Card bordered={false} className="!rounded-2xl !shadow-sm" loading={loading}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-[#f1f4eb] text-xs uppercase text-[#718078]"><tr><th className="p-3">Tên danh mục</th><th className="p-3">Trạng thái</th><th className="p-3">Cập nhật</th><th className="p-3">Thao tác</th></tr></thead>
            <tbody>
              {categories.map((item) => <tr className="border-t border-[#edf0e7]" key={item.id}>
                <td className="p-3 font-bold text-[#173d2b]">{item.name}</td>
                <td className="p-3"><Tag color={item.isActive ? "green" : "default"}>{item.isActive ? "Đang sử dụng" : "Tạm ẩn"}</Tag></td>
                <td className="p-3 text-[#718078]">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("vi-VN") : "-"}</td>
                <td className="p-3"><Space><AntButton size="small" onClick={() => setModal({ ...item })}>Sửa</AntButton><Popconfirm title="Xoá danh mục này?" description="Chỉ xoá được danh mục chưa có sản phẩm." okText="Xoá" cancelText="Huỷ" okButtonProps={{ danger: true }} onConfirm={() => remove(item)}><AntButton danger size="small">Xoá</AntButton></Popconfirm></Space></td>
              </tr>)}
            </tbody>
          </table>
          {!categories.length && !loading ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có danh mục" /> : null}
        </div>
      </Card>
      <Modal title={modal?.id ? "Sửa danh mục" : "Thêm danh mục"} open={Boolean(modal)} onCancel={() => setModal(null)} onOk={save} okText="Lưu" cancelText="Huỷ" confirmLoading={saving}>
        {modal ? <div className="grid gap-3"><Input autoFocus placeholder="Tên danh mục" value={modal.name} onChange={(event) => setModal({ ...modal, name: event.target.value })} /><Select value={modal.isActive !== false} onChange={(value) => setModal({ ...modal, isActive: value })} options={[{ value: true, label: "Đang sử dụng" }, { value: false, label: "Tạm ẩn" }]} /></div> : null}
      </Modal>
    </section>
  );
}
function AdminOrdersPage() {
  const [state, setState] = useState({ items: [], loading: true, error: "" });
  const [drafts, setDrafts] = useState({});
  const [amounts, setAmounts] = useState({});
  const [notes, setNotes] = useState({});
  const [details, setDetails] = useState({});
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const load = () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    orderApi
      .adminList()
      .then((result) => {
        const items = result.items || [];
        setState({ items, loading: false, error: "" });
        setDrafts(Object.fromEntries(items.map((item) => [item.id, item.status])));
        setAmounts(Object.fromEntries(items.map((item) => [item.id, item.totalAmount || 0])));
        setNotes(Object.fromEntries(items.map((item) => [item.id, item.adminNote || ""])));
      })
      .catch((error) => setState({ items: [], loading: false, error: error.message || "Không tải được danh sách order." }));
  };
  useEffect(load, []);
  const toggleDetails = async (id) => {
    if (details[id]) {
      setDetails((prev) => ({ ...prev, [id]: null }));
      setExpandedRowKeys((prev) => prev.filter((key) => key !== id));
      return;
    }
    try {
      const result = await orderApi.adminGet(id);
      setDetails((prev) => ({ ...prev, [id]: result }));
      setExpandedRowKeys((prev) => [...prev, id]);
    } catch (error) {
      message.error(error.message || "Không tải được chi tiết order.");
    }
  };
  const save = async (item) => {
    try {
      await orderApi.adminUpdateStatus(item.id, {
        status: drafts[item.id],
        totalAmount: Number(amounts[item.id] || 0),
        adminNote: notes[item.id] || "",
      });
      message.success(`Đã cập nhật ${item.orderCode}.`);
      load();
    } catch (error) {
      message.error(error.message || "Không thể cập nhật order.");
    }
  };
  const statusColor = { New: "blue", PendingPayment: "gold", Paid: "green", InProduction: "cyan", Completed: "success", Cancelled: "red" };
  const columns = [
    { title: "Mã đơn", dataIndex: "orderCode", key: "orderCode", render: (value, item) => <div><strong>{value}</strong><span className="block text-xs text-[#718078]">{new Date(item.createdAt).toLocaleString("vi-VN")}</span></div> },
    { title: "Khách hàng", key: "customer", render: (_, item) => <div><strong>{item.customerName}</strong><a className="block text-farm underline" href={`tel:${item.phone}`}>{item.phone}</a><span className="block max-w-48 truncate text-xs text-[#718078]">{item.contact || "Không có kênh khác"}</span></div> },
    { title: "Vật phẩm", key: "items", render: (_, item) => <AntButton size="small" icon={<InboxOutlined />} onClick={() => toggleDetails(item.id)}>{details[item.id] ? "Ẩn item" : "Xem item"}</AntButton> },
    { title: "Báo giá thủ công", key: "amount", render: (_, item) => <Space direction="vertical" size={6}><InputNumber className="!w-36" min={0} value={amounts[item.id] || null} placeholder="Nhập tiền" addonAfter="đ" onChange={(value) => setAmounts((prev) => ({ ...prev, [item.id]: value || 0 }))} /><Input.TextArea className="!w-44" autoSize={{ minRows: 2, maxRows: 4 }} placeholder="Ghi chú báo giá" value={notes[item.id] || ""} onChange={(event) => setNotes((prev) => ({ ...prev, [item.id]: event.target.value }))} /></Space> },
    { title: "Trạng thái", key: "status", render: (_, item) => <Select className="!w-44" value={drafts[item.id] || item.status} onChange={(value) => setDrafts((prev) => ({ ...prev, [item.id]: value }))} options={["New", "PendingPayment", "Paid", "InProduction", "Completed", "Cancelled"].map((value) => ({ value, label: value }))} /> },
    { title: "Thao tác", key: "action", render: (_, item) => <AntButton type="primary" icon={<SaveOutlined />} onClick={() => save(item)}>Lưu</AntButton> },
  ];
  return <section className="space-y-5">
    <div><Header title="Quản lý đơn hàng" /><p className="-mt-3 text-sm text-[#718078]">Xem thông tin liên hệ, tự báo giá và cập nhật tiến độ đơn.</p></div>
    {state.error ? <Alert showIcon type="error" message="Không tải được order" description={state.error} action={<AntButton size="small" onClick={load}>Thử lại</AntButton>} /> : null}
    <Card title={<Space><ShoppingCartOutlined /> Order cần xử lý <Badge count={state.items.filter((item) => item.status === "New").length} /></Space>} bordered={false} className="!rounded-2xl !shadow-sm">
      <div className="space-y-3 md:hidden">
        {state.loading ? <div className="py-8 text-center text-sm text-[#718078]">Đang tải order...</div> : null}
        {!state.loading && !state.items.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có order nào" /> : null}
        {state.items.map((item) => (
          <div className="rounded-2xl border border-[#e3e9df] bg-white p-4 shadow-sm" key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div><strong className="text-[#173d2b]">{item.orderCode}</strong><span className="mt-1 block text-xs text-[#718078]">{new Date(item.createdAt).toLocaleString("vi-VN")}</span></div>
              <Tag color={statusColor[item.status] || "default"}>{item.status}</Tag>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <div><span className="text-[#718078]">Khách hàng: </span><strong>{item.customerName}</strong></div>
              <a className="font-bold text-farm underline" href={`tel:${item.phone}`}>Gọi {item.phone}</a>
              <span className="break-words text-[#718078]">Liên hệ: {item.contact || "Không có kênh khác"}</span>
            </div>
            <div className="mt-4 grid gap-3 border-t border-[#edf0e7] pt-4">
              <AntButton block icon={<InboxOutlined />} onClick={() => toggleDetails(item.id)}>{details[item.id] ? "Ẩn vật phẩm" : "Xem vật phẩm"}</AntButton>
              {details[item.id] ? <div className="rounded-xl bg-[#f1f4eb] p-3 text-sm">{details[item.id].items?.map((orderItem) => <div className="flex justify-between gap-3 border-b border-white py-2 last:border-0" key={orderItem.id}><span className="break-words">{orderItem.productName}</span><strong className="shrink-0">x{orderItem.quantity}</strong></div>)}</div> : null}
              <InputNumber className="!w-full" min={0} value={amounts[item.id] || null} placeholder="Nhập báo giá" addonAfter="đ" onChange={(value) => setAmounts((prev) => ({ ...prev, [item.id]: value || 0 }))} />
              <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} placeholder="Ghi chú báo giá" value={notes[item.id] || ""} onChange={(event) => setNotes((prev) => ({ ...prev, [item.id]: event.target.value }))} />
              <Select className="!w-full" value={drafts[item.id] || item.status} onChange={(value) => setDrafts((prev) => ({ ...prev, [item.id]: value }))} options={["New", "PendingPayment", "Paid", "InProduction", "Completed", "Cancelled"].map((value) => ({ value, label: value }))} />
              <AntButton type="primary" block icon={<SaveOutlined />} onClick={() => save(item)}>Lưu order</AntButton>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block">
        <Table rowKey="id" loading={state.loading} columns={columns} dataSource={state.items} expandable={{ expandedRowKeys, onExpandedRowsChange: (keys) => setExpandedRowKeys(keys), expandedRowRender: (item) => details[item.id] ? <div className="rounded-xl bg-[#f1f4eb] p-3">{details[item.id].items?.map((orderItem) => <div className="flex max-w-xl justify-between border-b border-white py-2 last:border-0" key={orderItem.id}><span>{orderItem.productName}</span><strong>x{orderItem.quantity}</strong></div>)}{item.note ? <p className="mt-2 text-sm text-[#718078]">Ghi chú khách: {item.note}</p> : null}</div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bấm Xem item để tải chi tiết" />, rowExpandable: () => true }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có order nào" /> }} scroll={{ x: 1050 }} pagination={{ pageSize: 10, showSizeChanger: false }} />
      </div>
    </Card>
  </section>;
}
function AdminStatsPage() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    orderApi
      .adminStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);
  return (
    <section>
      <Header title="Thống kê" />
      <pre className="panel overflow-auto p-5 text-sm text-[#52635a]">
        {JSON.stringify(stats, null, 2)}
      </pre>
    </section>
  );
}

export default App;
