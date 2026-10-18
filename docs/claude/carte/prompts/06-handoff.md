# MASTER PROMPT 06 — đồng bộ bento DOM, canvas và điện thoại 3D

Đọc prompt 00, RESEARCH, implementation của 04–05 và source `fold/screens.ts`,
`fold/engine.ts`, `FoldScene.tsx`. Bước này bắt buộc. Không được kết luận hoàn
thành nếu bento mới biến thành bộ ảnh/nội dung Roco cũ lúc điện thoại xuất hiện.

## Hiện trạng cần sửa

Bento là React DOM. `drawInnerScreen()` hiện load 7 ảnh từ
`/sites/roco-bank/bento/<id>.webp` và tự vẽ text. Three.js dùng CanvasTexture từ
canvas đó. Screen được dựng/prewarm trước khi user cuộn tới. React component mới
không tự xuất hiện trong texture, và prewarm có thể giữ state cũ.

## Thiết kế một nguồn dữ liệu

Tạo scene model đã chốt của Carte: feature definitions, text, theme, selected
layer, paused clocks, card access, current decision, alert stack. DOM và texture
phải đọc model/state này; không copy nội dung thành hai bộ hardcode riêng.

Chọn và triển khai một phương án renderer có thể chứng minh:

1. Với illustration SVG: chia sẻ geometry/scene primitives, render DOM SVG và
   một bản SVG/canvas snapshot ở cùng state cho CanvasTexture.
2. Với component HTML/CSS: viết screen adapter có bố cục/type/states tương ứng,
   hoặc một pipeline texture snapshot được kiểm soát tại mốc handoff. Kiểm tra
   font, asset decode, CORS, transform, opacity và browser support thật.
3. Có thể dùng static poster có chủ đích cho illustration sau khi thu nhỏ nếu
   freeze đúng state trước blend và hai phía trùng nhau tại seam. Không được
   dùng poster Roco cũ, random state khác hoặc một screenshot nguyên website làm
   UI sống thay cho implementation.

Không mặc định `foreignObject`, React import hay html-to-canvas sẽ giải quyết
được mọi CSS. Tạo một spike chứng minh ở một tile khó trước, rồi mới áp dụng đủ 7.

## Handoff phải liên tục

Đọc `HANDOFF` constants thực tế, `innerScreenScale`, `setInnerScreenAlpha`,
texture resolution/gamma handling và resize math đang hoạt động. Giữ model/rig và
hiệu chỉnh màn hình của người dùng; sửa adapter thay vì viết lại fold engine.

Ở giai đoạn blend, hai renderer cùng text, viewport, layout state A/B và clock.
Đừng giữ DOM ở morph B trong khi canvas luôn vẽ BENTO_A. Dừng decorative loops
hoặc đồng bộ clock nếu chúng gây double image. Khôi phục/pause có quy tắc khi
cuộn ngược; refresh snapshot sau state change thay vì giữ texture warm-up cũ.

So các mốc pull xấp xỉ 0.28, 0.32, 0.40, 0.50, 0.55 hoặc đúng mốc constants mới,
cả xuôi và ngược. Kiểm tra text weight, crop, viền tile, màu đen, scale, khoảng
cách và độ nét. Không sửa sai bằng blur toàn bento hoặc che seam bằng overlay đen.

## Màn hình ngoài

WalletScreen hoặc adapter mới dùng cùng selected card/merchant/amount/result
với demo DOM. Dùng 4 ảnh thẻ polished hiện có khi cần. Chữ Roco, layout/sample copy
cũ và header Wallet/Register đã xóa không được tự quay lại qua draw commands.
Tên screen ví dụ Carte Wallet là label sản phẩm demo, không phải phục hồi nút
Wallet của header.

## Hiệu năng và fallback

Đợi font/image cần thiết trước snapshot; serialize/generate texture có cache và
dirty flag. Không render toàn DOM thành bitmap, tạo CanvasTexture mới, hoặc upload
mọi texture ở từng animation frame. Dọn observer, image URL, GPU texture và context
khi unmount; giữ cơ chế prewarm/idle hiện tại nếu nó đang giúp giảm hitch.

Nếu WebGL/model không tải được, giữ bento DOM và security narrative đọc được.
Không tải thêm model hoặc asset lớn ngoài nhu cầu của tính năng.

## Hoàn tất khi

7 feature mới hiện đúng trên inner screen; outer screen có state/copy Carte; không
seam/pop/brand cũ khi blend/resize/cuộn ngược; run/reset thay đổi đúng screen;
fallback và reduced motion rõ ràng. Lưu ảnh before/after cùng mốc trong ignored
output và ghi trade-off cụ thể nếu screen adapter có khác biệt nhỏ.
