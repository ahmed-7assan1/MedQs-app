const BASE_URL = "https://medqs.app";

export function replyKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: "🧠 Ask Dr. Q" }, { text: "📚 My Modules" }],
        [{ text: "📊 Dashboard" }, { text: "⚙️ Settings" }],
        [{ text: "👤 My Profile" }],
        [{ text: "🚀 Open MedOneX TMA", web_app: { url: `${BASE_URL}/tma` } }],
      ],
      resize_keyboard: true,
    },
  };
}

export function mainGuestKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "💬 AI Chat", callback_data: "ai_guest" }],
        [{ text: "📞 Contact Support", callback_data: "contact" }],
        [
          { text: "🔑 Sign In", callback_data: "auth_login_start" },
          { text: "📝 Register", callback_data: "auth_register" },
        ],
        [
          { text: "📚 Modules", callback_data: "modules" },
          { text: "🌐 Open App", url: "https://medqs.app" },
        ],
      ],
    },
  };
}

export function mainMenuKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "💬 AI Chat", callback_data: "ai_chat" },
          { text: "📚 Modules", callback_data: "modules" },
        ],
        [
          { text: "⚙ Settings", callback_data: "settings" },
          { text: "📞 Contact Support", callback_data: "contact" },
        ],
        [{ text: "🚪 Logout", callback_data: "confirm_logout" }],
      ],
    },
  };
}

export function cancelKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "⬅ Cancel", callback_data: "back_main" }],
      ],
    },
  };
}

export function confirmLogoutKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Yes, Logout", callback_data: "logout" }],
        [{ text: "⬅ Cancel", callback_data: "back_main" }],
      ],
    },
  };
}

export function groupMentionKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📚 Browse Modules", callback_data: "modules" }],
        [{ text: "💬 AI Chat (Free)", callback_data: "ai_guest" }],
        [{ text: "🔑 Sign In for Full Access", callback_data: "auth_login_start" }],
      ],
    },
  };
}

export function gradeKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎉 First Year", callback_data: "grade|1" }],
        [{ text: "🎉 Second Year", callback_data: "grade|2" }],
        [{ text: "🎉 Third Year", callback_data: "grade|3" }],
        [{ text: "🎉 Fourth Year", callback_data: "grade|4" }],
        [{ text: "🎉 Fifth Year", callback_data: "grade|5" }],
        [{ text: "🎉 Sixth Year", callback_data: "grade|6" }],
        [{ text: "🏠 Main Menu", callback_data: "back_main" }],
      ],
    },
  };
}
