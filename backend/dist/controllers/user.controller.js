import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAge, getZodiac } from "../utils/zodiac.js";
import { env } from "../config/env.js";
function publicAddressLabel(address, fallbackCity, fallbackDistrict) {
    const road = address?.road ?? address?.pedestrian ?? address?.footway ?? address?.cycleway;
    const ward = address?.suburb ?? address?.quarter ?? address?.neighbourhood ?? address?.village ?? address?.town;
    const district = address?.city_district ?? address?.district ?? address?.county ?? fallbackDistrict;
    const city = address?.city ?? address?.municipality ?? address?.state ?? fallbackCity;
    return [road, ward, district, city].filter(Boolean).filter((part, index, parts) => parts.indexOf(part) === index).join(" - ");
}
export const completeOnboarding = asyncHandler(async (req, res) => {
    const age = getAge(new Date(req.body.birthDate));
    if (age < 18 || age >= 30)
        return res.status(422).json({ message: "User must be from 18 to under 30" });
    const user = await User.findByIdAndUpdate(req.user.id, {
        displayName: req.body.displayName,
        birthDate: req.body.birthDate,
        age,
        zodiac: getZodiac(new Date(req.body.birthDate)),
        gender: req.body.gender,
        school: req.body.school,
        major: req.body.major,
        avatarUrl: req.body.avatarUrl,
        profilePhotos: (req.body.profilePhotos ?? []).filter(Boolean),
        onboardingCompleted: true,
        disclaimerAccepted: req.body.disclaimerAccepted ?? false,
        onboarding: {
            goals: req.body.goals,
            preferredTimes: req.body.preferredTimes,
            cafeStyles: req.body.cafeStyles,
            budgetRange: req.body.budgetRange,
            frequency: req.body.frequency,
            purpose: req.body.purpose,
            majorPreference: req.body.majorPreference,
            vibePreference: req.body.vibePreference,
            personality: req.body.personality,
            interests: req.body.interests,
            preferences: req.body.preferences
        },
        preferences: req.body.preferences,
        location: { type: "Point", coordinates: [req.body.location.lng, req.body.location.lat], addressLabel: req.body.location.addressLabel, source: req.body.location.source ?? "manual" }
    }, { new: true });
    res.json({ user });
});
export const updateLocation = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user.id, { location: { type: "Point", coordinates: [req.body.lng, req.body.lat], addressLabel: req.body.addressLabel, source: req.body.source ?? "manual" } }, { new: true });
    res.json({ user });
});
export const geocodeLocation = asyncHandler(async (req, res) => {
    const city = String(req.body.city).trim();
    const district = String(req.body.district).trim();
    const query = `${district}, ${city}, Việt Nam`;
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "5");
    url.searchParams.set("countrycodes", "vn");
    url.searchParams.set("addressdetails", "1");
    const response = await fetch(url, {
        headers: {
            "User-Agent": "UNI-MATE/1.0 location-geocode",
            "Accept-Language": "vi,en"
        }
    });
    if (!response.ok)
        return res.status(502).json({ message: "Không tìm được tọa độ khu vực lúc này." });
    const results = (await response.json());
    const normalizedCity = city.toLocaleLowerCase("vi-VN");
    const suggestions = results
        .map((item) => {
        const lat = Number(item.lat);
        const lng = Number(item.lon);
        const addressText = Object.values(item.address ?? {}).join(" ").toLocaleLowerCase("vi-VN");
        const displayName = item.display_name ?? `${district}, ${city}`;
        const inVietnam = /việt nam|vietnam/i.test(displayName) || item.address?.country_code === "vn";
        const cityMatches = displayName.toLocaleLowerCase("vi-VN").includes(normalizedCity) || addressText.includes(normalizedCity);
        return {
            lat,
            lng,
            addressLabel: publicAddressLabel(item.address, city, district),
            source: "manual",
            inVietnam,
            cityMatches
        };
    })
        .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
        .filter((item) => item.inVietnam)
        .map(({ inVietnam: _inVietnam, ...item }) => item)
        .slice(0, 5);
    if (!suggestions.length) {
        return res.status(404).json({ message: "Không tìm thấy khu vực này. Hãy thử nhập tên rõ hơn hoặc dùng GPS thật." });
    }
    res.json({ suggestions });
});
export const uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });
    const url = `${env.UPLOAD_BASE_URL}/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user.id, { avatarUrl: url });
    res.json({ url });
});
export const uploadProfilePhoto = asyncHandler(async (req, res) => {
    if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });
    const url = `${env.UPLOAD_BASE_URL}/${req.file.filename}`;
    res.json({ url });
});
export const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("-refreshTokenHash");
    res.json({ user });
});
export const updateProfile = asyncHandler(async (req, res) => {
    const existingUser = await User.findById(req.user.id);
    if (!existingUser)
        return res.status(404).json({ message: "User not found" });
    const updates = {};
    if (req.body.displayName !== undefined)
        updates.displayName = req.body.displayName;
    if (req.body.birthDate !== undefined) {
        const birthDate = new Date(req.body.birthDate);
        const age = getAge(birthDate);
        if (age < 18 || age >= 30)
            return res.status(422).json({ message: "Bạn phải từ 18 đến dưới 30 tuổi" });
        updates.birthDate = req.body.birthDate;
        updates.age = age;
        updates.zodiac = getZodiac(birthDate);
    }
    if (req.body.gender !== undefined)
        updates.gender = req.body.gender;
    if (req.body.school !== undefined)
        updates.school = req.body.school;
    if (req.body.major !== undefined)
        updates.major = req.body.major;
    if (req.body.avatarUrl !== undefined)
        updates.avatarUrl = req.body.avatarUrl;
    if (req.body.profilePhotos !== undefined)
        updates.profilePhotos = req.body.profilePhotos.filter(Boolean);
    if (req.body.location) {
        updates.location = {
            type: "Point",
            coordinates: [req.body.location.lng, req.body.location.lat],
            addressLabel: req.body.location.addressLabel ?? existingUser.location?.addressLabel,
            source: req.body.location.source ?? "manual"
        };
    }
    const currentOnboarding = existingUser.onboarding || {};
    const newOnboarding = { ...currentOnboarding };
    const onboardingFields = ["goals", "preferredTimes", "cafeStyles", "budgetRange", "frequency", "purpose", "majorPreference", "vibePreference", "personality", "interests", "preferences"];
    let hasOnboardingUpdate = false;
    for (const field of onboardingFields) {
        if (req.body[field] !== undefined) {
            newOnboarding[field] = req.body[field];
            hasOnboardingUpdate = true;
        }
    }
    if (hasOnboardingUpdate) {
        updates.onboarding = newOnboarding;
    }
    if (req.body.preferences !== undefined) {
        updates.preferences = req.body.preferences;
    }
    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).select("-refreshTokenHash");
    res.json({ user });
});
export const updateProfilePhotos = asyncHandler(async (req, res) => {
    const photos = Array.isArray(req.body.photos) ? req.body.photos.filter(Boolean) : [];
    const user = await User.findByIdAndUpdate(req.user.id, { $set: { profilePhotos: photos } }, { new: true }).select("-refreshTokenHash");
    res.json({ user });
});
export const changePassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user || !user.passwordHash) {
        return res.status(400).json({ message: "Tài khoản của bạn không sử dụng mật khẩu hoặc không tồn tại." });
    }
    const ok = await bcrypt.compare(req.body.oldPassword, user.passwordHash);
    if (!ok) {
        return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác." });
    }
    const sameAsOldPassword = await bcrypt.compare(req.body.newPassword, user.passwordHash);
    if (sameAsOldPassword) {
        return res.status(400).json({ message: "Mật khẩu mới không được trùng với mật khẩu cũ." });
    }
    const passwordHash = await bcrypt.hash(req.body.newPassword, 10);
    user.passwordHash = passwordHash;
    await user.save();
    res.json({ success: true, message: "Đổi mật khẩu thành công." });
});
export const deleteAccount = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user.id, {
        $set: { isActive: false, status: "suspended" },
        $unset: { refreshTokenHash: 1 }
    });
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Tài khoản đã được vô hiệu hóa." });
});
