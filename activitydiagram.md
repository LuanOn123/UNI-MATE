# Sơ đồ Activity Diagram: Discovery ➔ Matching ➔ Chatting (Swimlane 3 làn)

```mermaid
flowchart TD
    subgraph UserA ["Làn 1: Người dùng A"]
        %% Giai đoạn 1: Discovery & Matching
        A_Start([Bắt đầu]) --> A_EnterDiscover["Truy cập trang Khám phá (/discovery)"]
        A_ViewCard["Xem hồ sơ của Người dùng B (Tuổi, Trường, Vibe)"]
        A_Swipe{"Thực hiện hành động Quẹt?"}
        A_Pass["Quẹt trái (Pass / Bỏ qua)"]
        A_Like["Quẹt phải (Like / Thích)"]
        A_MatchPopup["Nhận Popup 'Mutual Match! Chat đã mở' -> Bấm 'Vào chat ngay'"]
        A_EnterChat["Truy cập thẳng vào Phòng Chat Realtime (/app/chat/:roomId)"]

        %% Giai đoạn 2: Chatting & Cafe Suggestion
        A_SendMsg["Nhắn tin chào hỏi, trò chuyện làm quen với User B"]
        A_GoSuggest["Bấm xem 'Gợi ý Quán Cafe trung điểm' (/app/matches/:id/places)"]
        A_PickPlace["Chọn 1 Quán Cafe hợp Vibe -> Bấm 'Đề xuất gặp ở đây'"]

        %% Giai đoạn 3: Chốt lịch & Dùng Voucher
        A_UseVoucher["Chốt lịch & Bấm dùng Voucher giảm giá của Quán trong Chat"]
    end

    subgraph System ["Làn 2: Hệ thống UNI-MATE - Backend & Thuật toán"]
        %% Giai đoạn 1: Discovery & Matching
        SYS_Filter["Lọc danh sách User theo: Tuổi (18-30), Khoảng cách GPS & Vibe"]
        SYS_StorePass["Lưu lịch sử Swipe (action = 'pass')"]
        SYS_StoreLike["Lưu lịch sử Swipe (action = 'like')"]
        SYS_CheckMutual{"Kiểm tra User B đã Like User A trước đó chưa?"}
        SYS_CreateMatch["Tạo Match + TỰ ĐỘNG khởi tạo Phòng Chat (status = 'chat_opened') + Phát Socket.IO"]

        %% Giai đoạn 2: Chatting & Cafe Suggestion
        SYS_PushMsg["Phát tin nhắn Realtime qua Socket.IO tới User B & Lưu DB"]
        SYS_CalcAlg["Tính trung điểm OSRM từ GPS 2 người & Gợi ý Quán Cafe hợp Vibe chung"]
        SYS_SavePropose["Lưu đề xuất Quán Cafe (status = 'cafe_proposed') + Thông báo Realtime"]
        SYS_ConfirmPlace["Cập nhật status = 'cafe_confirmed' + Ghim Quán Cafe vào Phòng Chat"]

        %% Giai đoạn 3: Chốt lịch & Dùng Voucher
        SYS_Redeem["Xác thực Voucher -> Cấp mã code giảm giá để dùng tại quầy Cafe"]
    end

    subgraph UserB ["Làn 3: Người dùng B"]
        %% Giai đoạn 1: Discovery & Matching
        B_LikeBefore["Đã Quẹt phải (Like) User A từ trước"]
        B_MatchNotify["Nhận thông báo Realtime 'Mutual Match! Phòng chat đã mở'"]
        B_EnterChat["Truy cập vào Phòng Chat cùng User A"]

        %% Giai đoạn 2: Chatting & Cafe Suggestion
        B_ReceiveMsg["Nhận tin nhắn của User A & Nhắn tin phản hồi"]
        B_ReceivePropose["Nhận thông báo: 'User A đề xuất gặp tại Quán Cafe X'"]
        B_ConfirmPlace["Xem thông tin Quán -> Bấm 'Đồng ý gặp ở đây' (Confirm Place)"]

        %% Giai đoạn 3: Chốt lịch & Dùng Voucher
        B_ViewVoucher["Nhận thông báo Voucher chung để cùng ra Quán trải nghiệm"]
    end

    %% Luồng kết nối (Transitions)
    %% 1. Discovery & Match -> Vào thẳng Chat
    A_EnterDiscover --> SYS_Filter
    SYS_Filter --> A_ViewCard
    A_ViewCard --> A_Swipe

    A_Swipe -- Pass --> A_Pass
    A_Pass --> SYS_StorePass
    SYS_StorePass --> SYS_Filter

    A_Swipe -- Like --> A_Like
    A_Like --> SYS_StoreLike
    SYS_StoreLike --> SYS_CheckMutual

    B_LikeBefore -. "Dữ liệu có sẵn trong DB" .-> SYS_CheckMutual
    SYS_CheckMutual -- Chưa Like --> SYS_Filter
    SYS_CheckMutual -- Đã Like trước (Mutual Match!) --> SYS_CreateMatch

    SYS_CreateMatch --> A_MatchPopup
    SYS_CreateMatch --> B_MatchNotify

    A_MatchPopup --> A_EnterChat
    B_MatchNotify --> B_EnterChat

    %% 2. Trò chuyện & Gợi ý Quán Cafe song song
    A_EnterChat --> A_SendMsg
    B_EnterChat --> B_ReceiveMsg
    A_SendMsg --> SYS_PushMsg
    SYS_PushMsg --> B_ReceiveMsg
    B_ReceiveMsg --> A_SendMsg

    A_SendMsg --> A_GoSuggest
    A_GoSuggest --> SYS_CalcAlg
    SYS_CalcAlg --> A_PickPlace
    A_PickPlace --> SYS_SavePropose
    SYS_SavePropose --> B_ReceivePropose
    B_ReceivePropose --> B_ConfirmPlace
    B_ConfirmPlace --> SYS_ConfirmPlace
    SYS_ConfirmPlace --> A_UseVoucher

    %% 3. Dùng Voucher & Kết thúc
    A_UseVoucher --> SYS_Redeem
    SYS_Redeem --> B_ViewVoucher
    B_ViewVoucher --> End([Kết thúc buổi hẹn / Ra quán cafe])
```

---

# 2. Sơ đồ Activity Diagram: Nhóm Học Tập & Trò Chuyện Nhóm (Swimlane 3 làn)
> Giai đoạn: Trưởng Nhóm Tạo Nhóm ➔ Mời Thành Viên bằng Email ➔ Trò Chuyện Nhóm Realtime (`Group Chat`)

```mermaid
flowchart TD
    subgraph Creator ["Làn 1: Trưởng Nhóm - Creator"]
        C_Start([Bắt đầu]) --> C_OpenGroup["Truy cập trang Quản lý Nhóm (/app/groups) -> Bấm 'Tạo nhóm mới'"]
        C_Submit["Nhập Tên nhóm, Mô tả, Mục đích & Số thành viên tối đa -> Bấm 'Tạo'"]
        C_AddMember["Bấm 'Thêm thành viên' -> Nhập Email người muốn mời (POST /groups/:id/members)"]
        C_EnterChat["Vào Phòng Chat Nhóm (/app/groups/:id/chat) -> Nhắn tin / Gửi ảnh"]
        C_Manage["Thao tác quản trị: Xóa thành viên hoặc Giải tán nhóm (POST /groups/:id/dissolve)"]
    end

    subgraph System ["Làn 2: Hệ thống UNI-MATE - Backend & Socket.IO"]
        SYS_ValidateGroup{"Kiểm tra form tạo hợp lệ?"}
        SYS_CreateGroup["Tạo bản ghi Group (creator = CreatorID, members = [CreatorID])"]
        SYS_CheckMember{"Kiểm tra Email:\nUser tồn tại & Nhóm chưa đầy?"}
        SYS_RejectError["Trả về lỗi: 'Không tìm thấy Email' hoặc 'Nhóm đã đầy'"]
        SYS_AddMember["Thêm MemberID vào mảng members + Cập nhật MongoDB"]
        SYS_NotifyGroup["Phát Socket.IO: 'Có thành viên mới vừa được thêm vào Nhóm'"]
        SYS_BroadcastMsg["Phát tin nhắn Realtime qua Socket.IO tới tất cả thành viên trong Nhóm"]
    end

    subgraph Member ["Làn 3: Thành Viên Được Mời - Member"]
        M_ReceiveInvite["Nhận thông báo & Thấy Nhóm xuất hiện tại danh sách của mình (/app/groups)"]
        M_EnterChat["Bấm 'Vào phòng chat' (/app/groups/:id/chat) để trò chuyện cùng nhóm"]
        M_SendMsg["Nhắn tin thảo luận, chia sẻ tài liệu học tập cùng các thành viên"]
        M_LeaveGroup["Bấm 'Rời nhóm' (DELETE /groups/:id/members/:userId) nếu muốn rời đi"]
    end

    %% Transitions
    C_OpenGroup --> C_Submit
    C_Submit --> SYS_ValidateGroup
    SYS_ValidateGroup -- Lỗi --> C_Submit
    SYS_ValidateGroup -- Hợp lệ --> SYS_CreateGroup
    SYS_CreateGroup --> C_AddMember

    C_AddMember --> SYS_CheckMember
    SYS_CheckMember -- Lỗi --> SYS_RejectError
    SYS_RejectError --> C_AddMember

    SYS_CheckMember -- Hợp lệ --> SYS_AddMember
    SYS_AddMember --> SYS_NotifyGroup
    SYS_NotifyGroup --> M_ReceiveInvite

    C_AddMember --> C_EnterChat
    M_ReceiveInvite --> M_EnterChat
    M_EnterChat --> M_SendMsg
    C_EnterChat --> SYS_BroadcastMsg
    M_SendMsg --> SYS_BroadcastMsg
    SYS_BroadcastMsg --> M_EnterChat

    M_LeaveGroup --> SYS_NotifyGroup
    C_Manage --> SYS_NotifyGroup
    M_SendMsg --> G_End([Kết thúc buổi học / gặp mặt])
    C_EnterChat --> G_End
```

---

# 3. Sơ đồ Activity Diagram: Đăng Ký Quán Cafe & Kiểm Duyệt Admin (Swimlane 3 làn)
> Giai đoạn: Partner Gửi Đơn ➔ Admin Kiểm Duyệt ➔ Phê Duyệt hoặc Từ Chối (`rejected status`)

```mermaid
flowchart TD
    subgraph Partner ["Làn 1: Đối Tác Quán Cafe - Partner"]
        P_Start([Bắt đầu]) --> P_OpenReg["Truy cập trang Đăng ký Đối tác (/partner/register)"]
        P_CheckExisting["Kiểm tra trạng thái đơn đăng ký hiện tại"]
        P_FillForm["Điền thông tin Quán (Tên, Địa chỉ, Vibe, Tiện ích, Giờ mở cửa)"]
        P_Submit["Bấm 'Gửi đơn đăng ký / Gửi lại' (POST /partner/register)"]
        P_WaitPending["Màn hình 'Đơn đăng ký đang chờ Admin xét duyệt'"]
        P_ViewRejected["Nhận thông báo: 'Đơn bị từ chối' + Xem lý do từ Admin"]
        P_EditResubmit["Chỉnh sửa thông tin/hình ảnh theo yêu cầu & gửi lại"]
        P_Dashboard["Truy cập Trang Quản Trị Quán Cafe (Đăng Voucher / Sửa quán)"]
    end

    subgraph System ["Làn 2: Hệ thống UNI-MATE - Backend DB"]
        SYS_StorePlace["Tạo bản ghi Place (status = 'pending', partner = PartnerID)"]
        SYS_UpdateRejected["Cập nhật Place status = 'rejected' + Lưu lý do từ chối"]
        SYS_UpdateActive["Cập nhật Place status = 'active' + Đưa vào GeoJSON PlaceCache"]
        SYS_NotifyPartner["Gửi thông báo Realtime / Email trạng thái đơn cho Partner"]
    end

    subgraph Admin ["Làn 3: Quản Trị Viên - Admin"]
        A_OpenAdmin["Truy cập Admin Dashboard (/app/admin) -> Tab Quán Cafe"]
        A_Review["Kiểm tra thông tin Quán, hình ảnh, địa chỉ thực tế & Vibe"]
        A_Decision{"Admin quyết định\nxét duyệt?"}
        A_ClickReject["Bấm 'Từ chối' (status: rejected) + Nhập lý do chi tiết"]
        A_ClickApprove["Bấm 'Phê duyệt' (status: active) -> Quán chính thức Live"]
    end

    %% Transitions
    P_OpenReg --> P_CheckExisting
    P_CheckExisting -- Chưa có / Đơn bị từ chối --> P_FillForm
    P_FillForm --> P_Submit
    P_Submit --> SYS_StorePlace
    SYS_StorePlace --> P_WaitPending
    SYS_StorePlace --> A_OpenAdmin

    A_OpenAdmin --> A_Review
    A_Review --> A_Decision

    A_Decision -- Từ chối --> A_ClickReject
    A_ClickReject --> SYS_UpdateRejected
    SYS_UpdateRejected --> SYS_NotifyPartner
    SYS_NotifyPartner --> P_ViewRejected
    P_ViewRejected --> P_EditResubmit
    P_EditResubmit --> P_Submit

    A_Decision -- Phê duyệt --> A_ClickApprove
    A_ClickApprove --> SYS_UpdateActive
    SYS_UpdateActive --> SYS_NotifyPartner
    SYS_NotifyPartner --> P_Dashboard
    P_Dashboard --> P_End([Quán chính thức xuất hiện trên Bản đồ & Gợi ý])
```

---

# 4. Sơ đồ Activity Diagram: Báo Cáo Vi Phạm & Xử Phạt Tự Động (Swimlane 3 làn)
> Giai đoạn: Gửi Báo Cáo (Report) ➔ Admin Thẩm Định ➔ Tự Động Khóa 3-5-7 Ngày / Ban (`suspendedUntil`)

```mermaid
flowchart TD
    subgraph Reporter ["Làn 1: Người Báo Cáo - User / Partner"]
        R_Start([Bắt đầu]) --> R_Trigger["Bấm nút 'Báo cáo vi phạm' tại Profile User B hoặc Quán Cafe"]
        R_Submit["Nhập lý do, đính kèm ảnh chứng cứ & chọn ngày vi phạm"]
        R_Confirm["Gửi báo cáo lên hệ thống (POST /safety/reports)"]
        R_Notify["Nhận thông báo 'Báo cáo đã được tiếp nhận & đang xử lý'"]
    end

    subgraph System ["Làn 2: Hệ thống UNI-MATE - Backend / Auto-Mod"]
        SYS_CreateReport["Lưu bản ghi Report (status = 'pending') + Đính kèm chat gốc"]
        SYS_Dismiss["Cập nhật Report status = 'dismissed' (Không phạt)"]
        SYS_IncWarn["Tăng warningCount của User bị báo cáo +1"]
        SYS_CheckCount{"Check warningCount của User?"}
        SYS_Warn1["Lần 1: Gửi thông báo Cảnh cáo lần 1 tới User"]
        SYS_Warn2["Lần 2: Tự động khóa 3 ngày (suspendedUntil = now + 3d)"]
        SYS_Warn3["Lần 3: Tự động khóa 10 ngày (suspendedUntil = now + 10d)"]
        SYS_Warn4["Lần 4+: Tự động Ban vĩnh viễn (status = 'banned')"]
        SYS_ManualLock["Khóa thủ công 3, 5, 7 ngày theo chỉ định Admin"]
        SYS_DropSession["Ngắt kết nối Socket.IO & Đăng xuất ngay lập tức tài khoản vi phạm"]
        SYS_Resolve["Cập nhật Report status = 'resolved'"]
    end

    subgraph Admin ["Làn 3: Quản Trị Viên - Admin"]
        A_ViewReports["Truy cập Tab Quản lý Báo cáo (/app/admin -> Reports)"]
        A_Inspect["Thẩm định bằng chứng (ảnh, ngày report & đọc log chat gốc)"]
        A_Verdict{"Quyết định của\nAdmin?"}
        A_Dismiss["Bấm 'Bác đơn' (Báo cáo không đúng sự thật)"]
        A_Penalty{"Chọn hình thức\nxử lý?"}
        A_WarnBtn["Bấm 'Cảnh cáo' -> Kích hoạt xử phạt tự động theo số lần"]
        A_LockBtn["Bấm 'Tạm khóa 3/5/7 ngày hoặc chọn giờ cụ thể'"]
        A_BanBtn["Bấm 'Ban vĩnh viễn tài khoản'"]
    end

    %% Transitions
    R_Confirm --> SYS_CreateReport
    SYS_CreateReport --> R_Notify
    SYS_CreateReport --> A_ViewReports
    A_ViewReports --> A_Inspect
    A_Inspect --> A_Verdict

    A_Verdict -- Không vi phạm --> A_Dismiss
    A_Dismiss --> SYS_Dismiss
    SYS_Dismiss --> EndReport([Kết thúc xử lý])

    A_Verdict -- Có vi phạm --> A_Penalty
    A_Penalty -- Cảnh cáo --> A_WarnBtn
    A_WarnBtn --> SYS_IncWarn
    SYS_IncWarn --> SYS_CheckCount

    SYS_CheckCount -- 1 lần --> SYS_Warn1
    SYS_CheckCount -- 2 lần --> SYS_Warn2
    SYS_CheckCount -- 3 lần --> SYS_Warn3
    SYS_CheckCount -- >= 4 lần --> SYS_Warn4

    A_Penalty -- Khóa thủ công --> A_LockBtn
    A_LockBtn --> SYS_ManualLock

    A_Penalty -- Ban vĩnh viễn --> A_BanBtn
    A_BanBtn --> SYS_Warn4

    SYS_Warn1 --> SYS_Resolve
    SYS_Warn2 --> SYS_DropSession
    SYS_Warn3 --> SYS_DropSession
    SYS_Warn4 --> SYS_DropSession
    SYS_ManualLock --> SYS_DropSession
    SYS_DropSession --> SYS_Resolve
    SYS_Resolve --> EndReport
```
