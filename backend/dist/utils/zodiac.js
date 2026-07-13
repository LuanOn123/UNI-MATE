export function getAge(birthDate) {
    if (!birthDate || Number.isNaN(birthDate.getTime()))
        return 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate()))
        age--;
    return age;
}
export function getZodiac(date) {
    if (!date || Number.isNaN(date.getTime()))
        return "Chưa cập nhật";
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const signs = [
        [20, "Ma Ket"], [19, "Bao Binh"], [20, "Song Ngu"], [20, "Bach Duong"],
        [21, "Kim Nguu"], [21, "Song Tu"], [22, "Cu Giai"], [23, "Su Tu"],
        [23, "Xu Nu"], [23, "Thien Binh"], [22, "Bo Cap"], [22, "Nhan Ma"], [31, "Ma Ket"]
    ];
    return d <= signs[m - 1][0] ? signs[m - 1][1] : signs[m][1];
}
