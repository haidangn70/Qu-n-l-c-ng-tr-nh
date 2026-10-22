# Cài Hạ tầng Cảng trên máy tính và điện thoại · v3.1

Phần mềm hỗ trợ cài dưới dạng ứng dụng web PWA: có biểu tượng riêng và cửa sổ ứng dụng. Máy tính và điện thoại mở cùng đường dẫn HTTPS của bản triển khai trên Render và đăng nhập bằng tài khoản được cấp. Không cần cài Node.js trên điện thoại, không cần tải tệp APK/EXE hoặc đưa lên App Store/Google Play để dùng cách cài này.

## Trước khi cài

Triển khai gói v3.1 lên Render theo RENDER.md. Dùng URL thật của dịch vụ, dạng https://ten-dich-vu.onrender.com hoặc tên miền HTTPS đã cấu hình. Địa chỉ http://127.0.0.1:3130 hiện tại chỉ là bản chạy thử trên máy tính này; mở địa chỉ đó trên điện thoại sẽ truy cập chính điện thoại, không truy cập máy tính.

Mở bằng trình duyệt thông thường. Nếu đang mở trong Zalo/Facebook hoặc trình duyệt bên trong ứng dụng khác, chọn mở bằng Chrome hoặc Safari. Nút **Cài ứng dụng** nằm ở trang đăng nhập và thanh công cụ sau đăng nhập. Cửa sổ hướng dẫn nhận diện loại thiết bị; nếu trình duyệt cung cấp hộp thoại cài thì có thêm nút **Cài ngay**.

## Máy tính Windows

1. Mở URL HTTPS của phần mềm bằng Microsoft Edge hoặc Google Chrome.
2. Bấm **Cài ứng dụng → Cài ngay** nếu có. Hoặc chọn biểu tượng cài ứng dụng cạnh thanh địa chỉ / trong menu trình duyệt.
3. Xác nhận trong hộp thoại cài của trình duyệt. Mở Hạ tầng Cảng từ danh sách ứng dụng; có thể ghim vào Start hoặc thanh tác vụ theo tùy chọn của hệ điều hành.

Tên mục trong menu thay đổi theo trình duyệt/phiên bản. Nếu không có nút tự động, xem menu cài ứng dụng của trình duyệt. Khi đã cài, mở từ biểu tượng Hạ tầng Cảng thay vì cài thêm lần nữa.

## Mac

Dùng Chrome/Edge với cách cài tương tự. Safari trên macOS có hỗ trợ có thể dùng **Thêm vào Dock** trong menu Tệp/Chia sẻ của trình duyệt. Không cần dùng trình cài Windows.

## Điện thoại Android

1. Mở URL HTTPS bằng Chrome.
2. Bấm **Cài ứng dụng → Cài ngay** nếu xuất hiện; hoặc Chrome → menu ⋮ → **Cài đặt ứng dụng** / **Thêm vào màn hình chính**.
3. Xác nhận rồi mở biểu tượng Hạ tầng Cảng trên điện thoại.

Một số trình duyệt chỉ tạo lối tắt hoặc không cung cấp chức năng cài. Dùng Chrome bản hiện hành để kiểm tra nếu không thấy tùy chọn.

## iPhone / iPad

1. Mở URL HTTPS bằng Safari.
2. Bấm **Chia sẻ** (có thể nằm trong menu thêm tùy bố cục Safari).
3. Chọn **Thêm vào Màn hình chính**.
4. Bật **Mở dưới dạng ứng dụng web** nếu có tùy chọn này, rồi bấm **Thêm**.
5. Mở biểu tượng Hạ tầng Cảng vừa thêm và đăng nhập. Safari trên iPhone không dùng nút cài tự động như Chrome; cửa sổ trong phần mềm có hướng dẫn thủ công.

## Tài khoản, dữ liệu và cập nhật

- Các thiết bị kết nối cùng một máy chủ. Hồ sơ/ảnh lưu thành công được đọc lại từ máy chủ bằng quyền của tài khoản; sau khi người khác lưu, tải lại danh sách để xem dữ liệu mới.
- Cần mạng để đăng nhập, xem hồ sơ và lưu/tải ảnh. Cài ứng dụng không tạo DB riêng trên điện thoại và không cung cấp chức năng nhập/lưu công việc hoàn toàn ngoại tuyến.
- Khi mở ứng dụng mà mất kết nối, trang hướng dẫn mất mạng xuất hiện sau khi service worker đã được cài thành công ít nhất một lần. Kiểm tra mạng rồi bấm **Thử kết nối lại**.
- Khi đang nhập mà mất mạng, bản nháp trong phiên hiện tại vẫn có thể được giữ như trước. Ảnh chưa gửi cần chọn lại nếu đóng biểu mẫu. Chưa có hàng đợi tự gửi dữ liệu sau khi có mạng.
- Cập nhật mã nguồn trên Render rồi mở lại ứng dụng khi có mạng. Tệp mã không giữ lâu trong cache; dữ liệu API, ảnh hiện trường và nội dung đăng nhập không được service worker lưu ngoại tuyến.
- Gỡ ứng dụng theo chức năng của hệ điều hành/trình duyệt không xóa hồ sơ đã lưu trên máy chủ.
- Cảnh báo tiến độ vẫn xem trong phần mềm; việc cài PWA chưa bổ sung thông báo đẩy khi ứng dụng đóng.

## Kiểm chứng

Đã kiểm tra cấu hình cài, kích thước PNG, biểu tượng iOS, vòng đời hộp thoại cài qua sự kiện trình duyệt, và hành vi mất mạng bằng kiểm thử tự động. Chưa trực tiếp cài lên một máy Android/iPhone vật lý hoặc trình duyệt ngoài Codex ở lần bàn giao này. Hộp thoại cài thực tế còn phụ thuộc trình duyệt, HTTPS, chính sách thiết bị và bản triển khai.

Nguồn chính thức: [MDN – cài đặt PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [Apple – thêm ứng dụng web trên iPhone](https://support.apple.com/guide/iphone/iphea86e5236/ios).
