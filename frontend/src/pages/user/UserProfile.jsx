import { useMemo, useState } from "react";

export default function UserProfile() {
  const [profile, setProfile] = useState({
    username: "Amina Bello",
    email: "citizen@example.com",
    phone: "+251912345678",
    region: "Addis Ababa",
    bio: "Interested in policy updates, public services, and community feedback.",
    notifications: true,
    publicProfile: false,
  });

  const [avatarPreview, setAvatarPreview] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordState, setPasswordState] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");

  const avatarLabel = useMemo(() => {
    if (avatarPreview) {
      return "Profile picture updated";
    }

    return profile.username
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [avatarPreview, profile.username]);

  const handleProfileChange = (event) => {
    const { name, value, type, checked } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordState((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSaveProfile = (event) => {
    event.preventDefault();
    setMessage("Profile updated locally. Connect this form to PUT /api/users/me when ready.");
  };

  const handleChangePassword = (event) => {
    event.preventDefault();

    if (!passwordState.currentPassword || !passwordState.newPassword || !passwordState.confirmPassword) {
      setMessage("Please fill in all password fields.");
      return;
    }

    if (passwordState.newPassword !== passwordState.confirmPassword) {
      setMessage("New password and confirmation do not match.");
      return;
    }

    setMessage("Password form is ready. Connect it to PUT /api/users/me/password.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="m-0 text-2xl font-bold text-slate-900">My profile</h2>
        <p className="mt-2 text-slate-600">Manage your identity, contact details, and security settings.</p>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSaveProfile}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-green-700 text-2xl font-bold text-white">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  <span>{avatarLabel}</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="m-0 text-lg font-semibold text-slate-900">Profile picture</h3>
              <p className="m-0 text-sm text-slate-600">Upload a photo or keep your initials avatar.</p>
              <label className="inline-flex cursor-pointer items-center rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
                Change picture
                <input className="hidden" type="file" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Username</span>
              <input
                name="username"
                value={profile.username}
                onChange={handleProfileChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                type="text"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Email</span>
              <input
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                type="email"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Phone number</span>
              <input
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                type="tel"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Region</span>
              <input
                name="region"
                value={profile.region}
                onChange={handleProfileChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                type="text"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Bio</span>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleProfileChange}
                rows="4"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Save changes
            </button>
            <button
              type="button"
              className="inline-flex rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={() => setMessage("Changes reset locally. Connect this to your API if needed.")}
            >
              Reset
            </button>
          </div>
        </form>

        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="m-0 text-lg font-semibold text-slate-900">Account details</h3>
            <div className="mt-4 grid gap-3 text-sm text-slate-700">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="font-medium">Verification</span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">Verified</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="font-medium">Account type</span>
                <span className="font-semibold text-slate-900">Citizen</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="font-medium">Member since</span>
                <span className="font-semibold text-slate-900">Apr 2026</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="m-0 text-lg font-semibold text-slate-900">Change password</h3>
              <button
                type="button"
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                onClick={() => setShowPasswordForm((previous) => !previous)}
              >
                {showPasswordForm ? "Hide" : "Open"}
              </button>
            </div>

            {showPasswordForm ? (
              <form className="mt-4 space-y-4" onSubmit={handleChangePassword}>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Current password</span>
                  <input
                    name="currentPassword"
                    value={passwordState.currentPassword}
                    onChange={handlePasswordChange}
                    type="password"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">New password</span>
                  <input
                    name="newPassword"
                    value={passwordState.newPassword}
                    onChange={handlePasswordChange}
                    type="password"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Confirm password</span>
                  <input
                    name="confirmPassword"
                    value={passwordState.confirmPassword}
                    onChange={handlePasswordChange}
                    type="password"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Update password
                </button>
              </form>
            ) : (
              <p className="mt-3 text-sm text-slate-600">Use this section to update your password anytime.</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="m-0 text-lg font-semibold text-slate-900">Quick actions</h3>
            <div className="mt-4 grid gap-3">
              <button type="button" className="rounded-xl bg-amber-50 px-4 py-3 text-left text-sm font-semibold text-amber-800 transition hover:bg-amber-100">
                Review privacy settings
              </button>
              <button type="button" className="rounded-xl bg-rose-50 px-4 py-3 text-left text-sm font-semibold text-rose-800 transition hover:bg-rose-100">
                Delete account
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
