# MASTER PROMPT 01 — Roco.bank → Carte và nội dung English

Thực thi bước đổi thương hiệu của bộ `docs/claude/carte/`. Đọc `AGENTS.md`,
`RESEARCH.md`, prompt 00 và diff hiện tại trước khi sửa. Giữ công việc chưa commit.
Đây là thay đổi sản phẩm thật trong repository, không chỉ một bản đề xuất copy.

## Mục tiêu

Tên hiển thị là **Carte**. Website nói về quyền kiểm soát và bảo mật thẻ tín dụng,
không tiếp tục quảng bá mình như một ngân hàng phát hành thẻ. Mọi nội dung hiển
thị dùng tiếng Anh.

## Tìm và sửa đủ các renderer

Kiểm tra tối thiểu:

- `src/lib/roco-bank/content.ts`: BRAND, HERO_COPY, TILES, aria labels.
- `src/app/layout.tsx`: metadata title/description, ngôn ngữ.
- `brand/Wordmark.tsx`, `hero/HeroCopy.tsx`, `navigation/SiteHeader.tsx`.
- `responsive/ResponsiveSite.tsx`: có heading hardcode, không tự dùng toàn bộ
  HERO_COPY như desktop.
- `bento/BentoGrid.tsx`: accessible name.
- `fold/ProcessColumn.tsx`: brand trong các bước và receipt copy.
- `src/lib/roco-bank/fold/screens.ts`: brand được vẽ bằng canvas, merchant demo,
  heading và thông báo, không thể tìm bằng DOM text đơn thuần.

Đổi brand trong nội dung/metadata/a11y thực sự được render. Không replace mù chữ
`roco` trong import path, URL asset, CSS variables, motion registry hoặc git history.
Giữ wordmark là live text và giữ symbol hiện tại trừ khi tôi cung cấp logo mới.
Logo Vietcombank/Techcombank/VIB/VietinBank trên artwork thẻ là minh họa giữ lại,
không đổi thành Carte hoặc ngụ ý có partnership.

## Copy định hướng

Hero eyebrow: **CREDIT CARD SECURITY**.

Headline hai dòng: **“Your cards.” / “Under your control.”**

Engine hero hiện có 5 slot từ: hai slot ở dòng 1 và ba slot ở dòng 2. Dùng
`Your` / `cards.` / `Under` / `your` / `control.` để bảo toàn contract nếu phù hợp;
đo lại wrapping, chiều rộng và placeholder để không còn asterisk/slot thừa.

Paragraph đề xuất:

> Carte brings card controls, payment reviews and security alerts into one clear
> view. Explore the demo, review unfamiliar activity, and keep decisions about
> your cards in your hands.

Điều chỉnh line breaks theo font/width thực tế, không phá layout để giữ câu dài.
Metadata: `Carte — Credit card security` và description khớp trải nghiệm demo.

Thay 7 chủ đề bento theo bảng RESEARCH. Đổi process heading thành
**“What happens before you approve.”**; chi tiết visual thực hiện ở các prompt sau.

Không giữ +390k customers, 300 companies trusted, $5.9m invested hoặc nội dung
AI bank/payment methods cũ. Không thay bằng số liệu bảo mật, chứng nhận hay
cam kết tuyệt đối chưa có căn cứ. Chỗ nào chưa có backend phải là demo rõ ràng.
Kiểm tra cả aria “Trusted by” của logo marquee; không dùng logo như chứng cứ
khách hàng/tích hợp khi chưa được xác nhận. Có thể giữ motion strip và thay bằng
capability labels phù hợp, thay vì thêm social-proof giả.

## Hoàn tất khi

Không còn brand Roco trong UI/metadata/canvas; heading desktop/mobile đồng nhất;
4 texture thẻ nguyên vẹn; các phần hero đã xóa không quay lại; không có broken
asset do đổi folder. Kiểm tra ở 1440×900 và 390×844. Ghi copy đã chốt để prompt
bento, phone và canvas dùng cùng một nguồn nội dung.
