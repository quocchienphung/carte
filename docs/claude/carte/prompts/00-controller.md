# MASTER PROMPT 00 — thực thi toàn bộ Carte

Bạn là engineer phụ trách chuyển website đang có trong repository này thành
**Carte**, website giới thiệu trải nghiệm **credit-card security**. Hãy thực thi
và kiểm chứng trên source hiện tại, không dừng ở kế hoạch hoặc một mockup ảnh.
Giao tiếp với tôi bằng tiếng Việt; nội dung sản phẩm bằng tiếng Anh.

## Đọc trước khi làm

1. Đọc `AGENTS.md`, `package.json`, cây route và Git status/diff. Dự án có các
   thay đổi chưa commit: đó là công việc của người dùng, phải bảo toàn.
2. Đọc guide tương ứng trong `node_modules/next/dist/docs/` trước khi sửa Next.js.
   Kiểm tra API/deprecation của phiên bản thực tế; không dựa vào phiên bản cũ.
3. Đọc `docs/claude/carte/RESEARCH.md`, `SOURCE-CATALOG.json`,
   `REGISTRY-CHECKS.json` và các prompt 01–09 trong cùng thư mục này.
4. Nếu canonical clone skill tại `.agents/skills/clone-website/` tồn tại, đọc và
   áp dụng nó. Nếu không có, tiếp tục theo bộ prompt này; không tự cho rằng đã đọc.
5. Ghi một baseline ngắn: các route, file chủ sở hữu từng section, ảnh desktop/
   mobile hiện tại, những phần người dùng vừa xóa, và lỗi có sẵn nếu có.

## Thứ tự bắt buộc

Thực thi **01 → 02 → 03 → 04 → 05 → 06 → 07 → 09**. 08 chỉ dùng nếu tôi cung
cấp thêm website tham khảo. 10 là recovery nếu kết quả đi chệch yêu cầu.

Nếu tôi chỉ gửi một prompt con để chạy riêng, chỉ thực thi giai đoạn đó; các quy
tắc chung trong 00 vẫn áp dụng, nhưng không tự chạy lại những bước đã hoàn tất.

01 đổi brand và nội dung trước. 02 kiểm chứng toàn bộ nguồn, 03 tạo reference lab
cho mẫu sẽ dùng; 04 và 05 mới ghép vào website. 06 là điều kiện bắt buộc vì bento
được render lại trong canvas/điện thoại, không chỉ tồn tại dưới dạng DOM.

Hãy tự xử lý những quyết định kỹ thuật thông thường. Đừng hỏi xác nhận sau mỗi
prompt. Nếu một mẫu Pro chưa truy cập được, dùng fallback công khai đã ghi trong
research để tiếp tục; liệt kê khác biệt trong báo cáo. Không tự mua gói hoặc đăng
nhập tài khoản. Chỉ đánh dấu hoàn thành một bước sau khi đạt điều kiện của bước đó.

## Hướng sản phẩm đã chốt

- Brand hiển thị: **Carte**, không phải Roco.bank, Carte Bank hay tên ngân hàng khác.
- Product language: English. Không dịch UI sang tiếng Việt.
- Seven bento stories: Freeze / Layered protection / Payment route / Signals /
  Verification / Review & decision / Alerts.
- Next section: **“What happens before you approve.”**, gồm 6 checkpoint security
  demo đồng bộ với điện thoại gập đang có.
- UI phải là React/TypeScript/CSS/SVG/canvas chỉnh sửa được. Dùng source component
  được truy cập hợp lệ hoặc tái triển khai từ preview công khai. Phân biệt rõ hai cách.

## Giữ các quyết định thiết kế của người dùng

Giữ 4 ảnh thẻ đã được làm nét, hiệu ứng kim loại và chữ VISA Signature vàng của
VietinBank; giữ choreography card stack, scroll transition, morph bento, phone rig
và bottom morph menu. Không dựng lại ứng dụng từ đầu.

Hero/header đã xóa avatar/tên/số dư, Wallet/Register, Buy Card/Discover và chữ dọc
Personal + Business. Không tạo lại chúng trong JSX, canvas header hoặc mobile.
Security demo được có control riêng trong bento/section tiếp theo khi cần.

Giữ namespace `roco-bank` và ID motion trong lượt đầu nếu không có lý do kỹ thuật
để đổi. Đổi tên thương hiệu không đòi di chuyển toàn bộ asset/source folder.

## Cách quản lý tiến độ

Lưu kết quả ngắn trong `docs/implementation/carte/`: source manifest, selection
map, execution log, acceptance report. Ảnh/video/trace tạm ở đường dẫn ignored
hoặc ngoài repo. Chỉ import source và asset cần dùng, không vendor cả 107 demo.

Mỗi giai đoạn kết thúc bằng ghi rõ: đã đổi gì; kiểm chứng gì; file liên quan;
vấn đề còn lại; bước kế tiếp. Khi phải chuyển phiên, để lại state đủ để tiếp tục.
Không tuyên bố pixel-perfect nếu chưa so source/local đúng viewport và state.

## Điều kiện cuối cùng

Toàn bộ giao diện mang brand Carte, English copy thống nhất; bento có đủ 7 visual/
component có hành vi thật ở mức demo; phone scene không hiện bento hoặc brand cũ;
mobile và reduced-motion có nội dung tương đương; không có số liệu/chứng nhận tự
bịa. `npm run check` qua và kiểm tra browser của prompt 09 hoàn tất.

Kết thúc bằng preview URL, bảng source → component Carte, kiểm tra đã chạy,
ảnh so sánh đại diện và những giới hạn thực tế. Chưa được yêu cầu commit/push/
deploy hoặc viết lại lịch sử Git.
