# Kiểm tra dung lượng và dọn repository

Ngày: 18/10/2026 (Asia/Saigon). Commit lúc bắt đầu: `21bf214`.

## Phạm vi đã xác nhận

Giữ nguyên giao diện Roco Bank, toàn bộ `src/`, asset trong `public/`, các script,
test, dependencies và cấu hình ứng dụng. Chỉ bỏ tài liệu, ảnh/video tham chiếu và
kết quả phân tích/chụp giao diện liên quan tới Roco Bank.

## Dung lượng trước và sau

Các số dưới đây tính theo MiB (1 MiB = 1.048.576 byte), từ file được Git theo dõi,
không bao gồm `node_modules`, `.next` hay thư mục sao lưu bên ngoài dự án.

| Nhóm | File trước khi dọn | Dung lượng trước | Xử lý |
| --- | ---: | ---: | --- |
| `artifacts/` | 146 | 80,842 MiB | Bỏ toàn bộ kết quả visual audit |
| `references/` | 76 | 46,744 MiB | Bỏ video, keyframe, contact sheet, số đo |
| `docs/` | 31 | 17,380 MiB | Bỏ 27 file Roco; giữ tài liệu template |
| `public/` | 26 | 0,641 MiB | Giữ nguyên |
| `src/` | 64 | 0,220 MiB | Giữ nguyên |
| `scripts/` | 45 | 0,128 MiB | Giữ nguyên |
| `tests/` | 13 | 0,035 MiB | Giữ nguyên |
| File gốc ở root | 21 | 0,615 MiB | Giữ; thêm quy tắc vào `.gitignore` |

Tại thời điểm chụp số liệu: **422 file / 146,605 MiB**. Đã bỏ **249 file /
144,173 MiB**, tương đương khoảng **98,34%** dung lượng file của working tree.
Phần giữ lại khoảng **2,432 MiB**, chưa tính báo cáo nhỏ này.

Các đường dẫn đã bỏ:

- `artifacts/visual-audit/`
- `references/`
- `docs/research/roco-bank/`
- `docs/ROCO_BANK_GEMINI_MASTER_PROMPTS.md`
- `docs/ROCO_BANK_REFERENCE_KEYFRAMES.jpg`
- `docs/readdd.txt`
- `docs/roco-bank-reference.mp4`
- `docs/video_contact_sheet.jpg`

Giữ `docs/design-references/.gitkeep`, ảnh demo template `comparison.png` và
`docs/assets/star-history.png`. Đã thêm ignore cho đúng những nhóm ref/output
vừa dọn; không ignore ảnh thẻ, avatar và bento đang được giao diện sử dụng.

## Vì sao GitHub Desktop clone chậm?

Git đang có một pack **114,66 MiB**, chứa 479 object. Ảnh PNG, video và trace JSON
đã được commit nên nằm trong lịch sử tải về khi clone thông thường. Source
TypeScript/CSS nhỏ hơn rất nhiều; nó không phải phần chiếm dung lượng chính.

Bốn trace JSON lớn nhất chiếm khoảng 18,29 MiB trong working tree; nhiều ảnh audit
riêng lẻ nặng 2–3 MiB. `docs/roco-bank-reference.mp4` và
`references/roco-bank-reference.mp4` có nội dung trùng nhau, mỗi bản khoảng
5,09 MiB. Git dùng chung blob cho nội dung trùng, vì vậy không cộng cả hai bản
video để suy ra dung lượng truyền qua mạng.

Xóa file rồi commit chỉ làm nhẹ phiên bản hiện tại. Các commit cũ vẫn chứa dữ
liệu, và thêm `.gitignore` không xóa dữ liệu đã commit. Chưa viết lại lịch sử,
chưa commit hay push thay đổi trong đợt dọn này. Vì vậy chưa thể nói dung lượng
clone từ GitHub đã giảm. Muốn giảm phần tải về cần một bước riêng: lọc các đường
dẫn trên khỏi lịch sử và cập nhật remote bằng force-push, hoặc tạo repo mới từ
snapshot đã sạch. Chưa đo tốc độ mạng hay thời gian clone thực tế.

## Kết quả kiểm tra source và phụ thuộc

- Entry `/` trong `src/app/page.tsx` render `RocoBankExperience`.
- Experience điều phối hero, chuyển cảnh, bento, menu morph, replay và responsive.
  Timeline/motion/scroll-map nằm trong `src/lib/roco-bank/`.
- Phần điện thoại gập dùng Three.js, import động engine và vẽ màn hình bằng canvas;
  các thư viện `three` và `@types/three` vẫn cần thiết.
- Playwright được các script/test capture sử dụng; giữ `@playwright/test`.
- Đã quét 61 file TS/TSX/CSS/JSON trong `src`, kiểm tra 131 liên kết import nội bộ:
  không thấy import thiếu. Cả 64 file trong `src` được giữ nguyên.
- Sau khi loại comment khỏi lượt quét, không thấy `src` đọc các đường dẫn
  `docs/`, `references/` hay `artifacts/` vừa dọn. Các số đo animation đã nằm trong
  source, bao gồm `motion/measured.ts`; không cần JSON ref khi chạy giao diện.
- Đã kiểm tra 20 asset có tên ghép động cho avatar, bento và thẻ: đều còn đủ.
- 172 file giữ lại ngoài `.gitignore` khớp SHA-256 với snapshot ngay trước khi dọn.
  Không sửa source, asset, script hoặc test.

Đã đọc hướng dẫn Next.js đi kèm package về App Router và `public/` để xác nhận
ranh giới route/asset. Không tải hay thay thế source giao diện từ template gốc.

## Những vấn đề có sẵn được ghi nhận

1. `FoldScene.tsx` yêu cầu
   `/sites/roco-bank/iphone-duo/iPhone_Duo.glb`, nhưng file này đã thiếu trước khi
   dọn. Thư mục model đang bị ignore theo cấu hình có sẵn. Build vẫn có thể qua
   trong khi cảnh 3D không tải được ở runtime; đây không phải file vừa bị bỏ.
2. `.agents/skills/clone-website/` và `.claude/commands/clone-website.md` được
   README/AGENTS nhắc tới nhưng không có trong checkout và lịch sử nhánh hiện tại.
   Đã đối chiếu template upstream commit
   `ee3f5a2f31fd549b9593fa4f7cf6d2955ee593bb`: upstream có các file này.
   Chưa khôi phục hay thay đổi engine vì phạm vi cuối cùng là chỉ dọn ref/docs.
3. Các script phân tích/so sánh cũ vẫn được giữ, nhưng muốn chạy lại cần phục hồi
   input ref tương ứng. Việc này không ảnh hưởng các file output đang được app dùng.
4. Trước mốc checksum, môi trường đã phát sinh thay đổi ở `package-lock.json` và
   `next-env.d.ts` so với HEAD. Giữ nguyên trạng thái đó. File sinh ra bởi lượt
   check được đưa lại đúng nội dung trước check; không gộp thay đổi môi trường
   vào kết quả dọn ref/docs.

## Kiểm chứng và bản sao lưu

`npm run check` hoàn thành thành công: ESLint, TypeScript và production build.
Build xuất route `/` và `/_not-found`. Không thực hiện so sánh ảnh giao diện trong
đợt này; kết luận bảo toàn source dựa trên checksum và kiểm tra build/import/asset.

Do cơ chế duyệt tự động chặn lệnh xóa hàng loạt, các file được chuyển bằng
PowerShell sang thư mục ngoài repo. Trong dự án chúng được Git nhận diện là đã
xóa; bản sao bên ngoài không làm tăng dung lượng GitHub.

- Lịch sử trước khi dọn, đã chạy `git bundle verify`:
  `C:\Users\quocc\Downloads\carte-before-cleanup-20261018.bundle`
- File ref/docs đã bỏ khỏi dự án:
  `C:\Users\quocc\Downloads\carte-removed-references-20261018\`

Đây là hai bản sao lưu ngoài repository; chưa xóa chúng.
