# UNI-MATE Sequence Diagrams

> Tài liệu này là bản khái quát ban đầu. Bản UML theo đúng luồng implementation hiện tại nằm tại [actual-uml-sequence-diagrams.md](./actual-uml-sequence-diagrams.md). Bản UML mới là nguồn nên sử dụng cho báo cáo.

Các sơ đồ dưới đây phản ánh luồng đang được cài đặt trong backend và frontend hiện tại.

## 1. Đăng ký tài khoản và hoàn thành onboarding

```mermaid
sequenceDiagram
    autonumber
    actor U as Người dùng
    participant FE as Web Frontend
    participant API as Auth/User API
    participant DB as MongoDB
    participant GEO as Nominatim

    U->>FE: Nhập email, mật khẩu và xác nhận mật khẩu
    FE->>API: POST /auth/register
    API->>DB: Kiểm tra email
    alt Email đã tồn tại
        API-->>FE: 409 Email already exists
    else Email chưa tồn tại
        API->>DB: Tạo User và lưu refreshTokenHash
        API-->>FE: User + access token + refresh token
    end

    opt Người dùng nhập khu vực thủ công
        FE->>API: POST /users/location/geocode
        API->>GEO: Tìm tọa độ theo quận, thành phố
        GEO-->>API: Danh sách tọa độ
        API-->>FE: Gợi ý vị trí
    end

    U->>FE: Hoàn thành hồ sơ và khảo sát
    FE->>API: POST /users/onboarding
    API->>API: Kiểm tra tuổi từ 18 đến dưới 30
    alt Dữ liệu không hợp lệ
        API-->>FE: 422 Validation error
    else Hợp lệ
        API->>DB: Cập nhật profile, preference, location
        API-->>FE: User đã hoàn thành onboarding
    end
```

## 2. Đăng nhập thống nhất cho mọi vai trò

```mermaid
sequenceDiagram
    autonumber
    actor U as Người dùng/Admin
    participant FE as Web Frontend
    participant API as Auth API
    participant DB as MongoDB

    U->>FE: Nhập email và mật khẩu
    FE->>API: POST /auth/login
    API->>DB: Tìm User và kiểm tra trạng thái
    alt Tài khoản suspended/banned/inactive
        API-->>FE: 403 Account is locked
    else Sai thông tin đăng nhập
        API-->>FE: 401 Invalid credentials
    else Thông tin đăng nhập hợp lệ
        API->>DB: Cập nhật lastLoginAt, token
        API-->>FE: User + access/refresh token
        FE-->>U: Điều hướng theo role/onboardingCompleted
    end

    Note over FE,API: User, partner và admin dùng cùng luồng đăng nhập, không có OTP/2FA.
```

## 3. Discovery, like/pass và tạo match

> Lưu ý: implementation hiện tại mở chat ngay khi mutual like, chưa chờ xác nhận quán.

```mermaid
sequenceDiagram
    autonumber
    actor A as User A
    actor B as User B
    participant FE as Web Frontend
    participant API as Discovery API
    participant MS as Matching Service
    participant OSRM as OSRM
    participant DB as MongoDB
    participant WS as Socket.IO

    A->>FE: Mở trang Discovery
    FE->>API: GET /discovery
    API->>MS: getDiscoveryFeed(A)
    MS->>DB: Lọc user đã swipe, bị block, sai độ tuổi/mục đích/vị trí
    MS->>OSRM: Tính thời gian và quãng đường di chuyển
    OSRM-->>MS: Distance/duration matrix
    MS->>MS: Tính compatibility score và sắp xếp
    MS-->>FE: Tối đa 10 ứng viên

    A->>FE: Like hoặc Pass B
    FE->>API: POST /discovery/like hoặc /pass
    API->>DB: Upsert Swipe(A, B, action)
    alt A chọn Pass
        API-->>FE: matched = false
    else A Like nhưng B chưa Like A
        API->>DB: Tạo incoming_like Notification cho B
        API->>WS: Emit notification:new tới B
        WS-->>B: Thông báo có lượt thích
        API-->>FE: liked = true, matched = false
    else B đã Like A
        API->>OSRM: Tính compatibility score
        API->>DB: Tạo Match(status = chat_opened)
        API->>DB: Tạo ChatRoom(status = active)
        API->>DB: Gắn ChatRoom vào Match
        API-->>FE: matched = true + Match
    end
```

## 4. Đề xuất, xác nhận hoặc từ chối quán

```mermaid
sequenceDiagram
    autonumber
    actor A as Người đề xuất
    actor B as Người còn lại
    participant FE as Web Frontend
    participant API as Match API
    participant DB as MongoDB
    participant WS as Socket.IO

    A->>FE: Xem gợi ý quán
    FE->>API: GET /matches/:id/place-suggestions
    API->>DB: Kiểm tra Match và thời hạn
    API->>DB: Lấy các quán phù hợp
    API-->>FE: Danh sách quán

    A->>FE: Chọn một quán
    FE->>API: POST /matches/:id/select-place
    API->>DB: Kiểm tra quán active và quyền tham gia Match
    API->>DB: Đổi proposal cũ thành replaced
    API->>DB: Tạo CafeProposal active
    API->>DB: selectedBy=A, confirmedBy=[A], status=cafe_proposed
    API->>DB: Tạo Notification cho B
    API->>WS: Emit notification:new và match:updated
    WS-->>B: Hiển thị đề xuất quán

    alt B xác nhận
        B->>FE: Đồng ý quán
        FE->>API: POST /matches/:id/confirm-place
        API->>DB: Thêm B vào confirmedBy
        API->>DB: Đánh dấu CafeProposal accepted
        API->>DB: Upsert ChatRoom active
        API->>DB: Match status=chat_opened
        API->>WS: Emit match:updated cho A và B
    else B từ chối
        B->>FE: Từ chối quán
        FE->>API: POST /matches/:id/reject-place
        API->>DB: Proposal status=rejected
        API->>DB: Xóa selectedPlace/selectedBy/confirmedBy
        API->>DB: Match status=matched
        API->>DB: Tạo Notification cho A
        API->>WS: Emit notification:new và match:updated
    end
```

## 5. Chat cá nhân realtime

```mermaid
sequenceDiagram
    autonumber
    actor A as Người gửi
    actor B as Người nhận
    participant FE_A as Frontend A
    participant WS as Socket.IO Server
    participant API as Chat API
    participant DB as MongoDB
    participant FE_B as Frontend B

    A->>FE_A: Mở phòng chat
    FE_A->>API: GET /chat/:roomId
    API->>DB: Kiểm tra thành viên, Match và trạng thái block
    alt Chat không active/chat_opened
        API-->>FE_A: 403 Chat is locked/inactive
    else Được phép chat
        API->>DB: Lấy tối đa 100 Message
        API-->>FE_A: Room + messages + blockState
        FE_A->>WS: join_room(roomId)
        WS->>DB: Xác minh user thuộc phòng active
    end

    A->>FE_A: Nhập và gửi tin nhắn
    FE_A->>WS: send_message(roomId, text/file)
    WS->>DB: Kiểm tra ChatRoom active và Match chat_opened
    alt Tin rỗng hoặc chat bị khóa
        WS-->>FE_A: message_error
    else Hợp lệ
        WS->>DB: Tạo Message, readBy=[A]
        WS->>DB: Cập nhật lastMessage và bỏ hiddenBy
        WS-->>FE_A: new_message
        WS-->>FE_B: new_message
        WS->>DB: Tạo Notification cho B
        WS-->>FE_B: notification:new
    end

    FE_B->>WS: mark_read(roomId)
    WS->>DB: Thêm B vào readBy của các Message
    WS-->>FE_A: message_read
```

## 6. Tạo nhóm, quản lý thành viên và chat nhóm

```mermaid
sequenceDiagram
    autonumber
    actor O as Trưởng nhóm
    actor M as Thành viên
    participant FE as Web Frontend
    participant API as Group API
    participant WS as Socket.IO Server
    participant DB as MongoDB

    O->>FE: Nhập thông tin nhóm
    FE->>API: POST /groups
    API->>DB: Tạo Group, creator=O, members=[O]
    API-->>FE: Group mới

    O->>FE: Thêm thành viên bằng email
    FE->>API: POST /groups/:id/members
    API->>DB: Kiểm tra creator, trạng thái và sức chứa
    API->>DB: Tìm User active theo email
    alt Không có quyền/nhóm đầy/user không tồn tại
        API-->>FE: 400/403/404
    else Hợp lệ
        API->>DB: Thêm M vào members
        API-->>FE: Group đã cập nhật
    end

    M->>FE: Mở chat nhóm
    FE->>API: GET /groups/:id/messages
    API->>DB: Kiểm tra membership và lấy tin nhắn
    API-->>FE: GroupMessage[]
    FE->>WS: join_group(groupId)
    WS->>DB: Xác minh thành viên và group active
    M->>FE: Gửi tin nhắn
    FE->>WS: send_group_message
    WS->>DB: Kiểm tra thành viên, nội dung và trạng thái
    WS->>DB: Tạo GroupMessage
    WS-->>FE: new_group_message
    WS->>DB: Tạo Notification cho các thành viên còn lại
```

## 7. Báo cáo, block và xử lý của admin

```mermaid
sequenceDiagram
    autonumber
    actor U as Người báo cáo
    actor AD as Admin
    actor T as Người bị báo cáo
    participant FE as Web Frontend
    participant API as Safety/Admin API
    participant DB as MongoDB
    participant WS as Socket.IO

    opt Đính kèm ảnh bằng chứng
        U->>FE: Chọn ảnh
        FE->>API: POST /upload/report-evidence
        API-->>FE: evidenceUrl
    end
    U->>FE: Gửi báo cáo
    FE->>API: POST /safety/report
    API->>DB: Xác minh ChatRoom thuộc hai người nếu có room
    API->>DB: Tạo Report
    API->>DB: Đếm số reporter khác nhau của T
    opt Có ít nhất 3 reporter khác nhau
        API->>DB: Đánh dấu các report đang mở là priority
    end
    API-->>FE: Report đã tạo

    opt Người dùng block T
        FE->>API: POST /safety/block
        API->>DB: Thêm T vào blockedUsers của U
        API->>DB: Đặt các Match và ChatRoom liên quan thành blocked
        API-->>FE: User blocked
    end

    AD->>FE: Mở chi tiết báo cáo
    FE->>API: GET /admin/reports/:id
    API->>DB: Lấy Report và lịch sử Message của room
    API-->>FE: Report + messages
    AD->>FE: Chọn dismiss/warn/suspend/ban
    FE->>API: PATCH /admin/reports/:id
    alt Dismiss
        API->>DB: Report status=dismissed
    else Warn
        API->>DB: Tăng warningCount
        API->>DB: Có thể tự suspend ở lần 2/3 hoặc ban ở lần 4
        API->>WS: Gửi notification cho T
    else Suspend hoặc Ban
        API->>DB: Cập nhật trạng thái User và Report
        API->>WS: Gửi notification và ngắt socket của T
    end
    API->>DB: Tạo AdminAction audit log
    API-->>FE: Kết quả moderation
```

## 8. Partner đăng ký quán, admin duyệt và tạo voucher

```mermaid
sequenceDiagram
    autonumber
    actor P as Chủ quán
    actor AD as Admin
    participant FE as Web Frontend
    participant API as Places/Partner/Admin API
    participant DB as MongoDB
    participant WS as Socket.IO

    P->>FE: Gửi hồ sơ đăng ký quán
    FE->>API: POST /places/partner-register
    API->>DB: Kiểm tra hồ sơ pending/active hiện có
    alt Đã có hồ sơ pending hoặc active
        API-->>FE: 409 Hồ sơ đã tồn tại
    else Hợp lệ
        API->>DB: Tạo PlaceCache(status=pending, isPartnerPlace=true)
        API-->>FE: Đã gửi chờ duyệt
    end

    AD->>FE: Duyệt hồ sơ quán
    FE->>API: PATCH /admin/places/:id/status
    API->>DB: Đổi Place status=active
    API->>DB: Đổi role của P thành partner
    API->>DB: Tạo AdminAction
    API->>WS: Gửi notification duyệt quán cho P
    WS-->>P: Quán đã được duyệt

    P->>FE: Tạo voucher
    FE->>API: POST /partner/places/:placeId/vouchers
    API->>DB: Xác minh P sở hữu quán và quán active
    API->>DB: Kiểm tra mã voucher không trùng trong quán
    alt Không hợp lệ hoặc mã trùng
        API-->>FE: 400/403
    else Hợp lệ
        API->>DB: Tạo Voucher
        API-->>FE: Voucher mới
    end
```

## 9. Người dùng xem và lưu voucher

```mermaid
sequenceDiagram
    autonumber
    actor U as Người dùng
    participant FE as Web Frontend
    participant API as Places API
    participant DB as MongoDB

    U->>FE: Mở chi tiết quán
    par Lấy thông tin quán
        FE->>API: GET /places/:placeId
        API->>DB: Tìm Place status=active
        API-->>FE: Place
    and Lấy voucher khả dụng
        FE->>API: GET /places/:placeId/vouchers
        API->>DB: Lọc voucher active, chưa hết hạn, còn lượt
        API-->>FE: Voucher[] + savedByMe
    end

    U->>FE: Lưu voucher
    FE->>API: POST /places/:placeId/vouchers/:voucherId/save
    API->>DB: Kiểm tra U đã lưu chưa
    alt Đã lưu
        API-->>FE: saved=true, alreadySaved=true
    else Còn hiệu lực và còn lượt
        API->>DB: Thêm U vào savedBy, tăng currentUsageCount
        API-->>FE: saved=true
    else Hết hạn/hết lượt/không khả dụng
        API-->>FE: 400 Voucher không khả dụng
    end
```

## Sai khác nghiệp vụ cần xử lý

README mô tả quy tắc **Cafe-Gated Chat**: chỉ mở chat sau khi cả hai xác nhận cùng một quán. Tuy nhiên `matching.service.ts` hiện tạo `Match` với `status = chat_opened` và tạo `ChatRoom` ngay khi mutual like. Vì vậy sequence số 3 phản ánh code đang chạy, còn sequence số 4 phản ánh API xác nhận quán vẫn tồn tại nhưng không còn thực sự là cổng bắt buộc trước chat.
