import { Markup } from "telegraf";

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

export function settingsKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔑 Change API Keys", callback_data: "settings_keys" }],
        [{ text: "🤖 Change Default Provider", callback_data: "settings_provider" }],
        [{ text: "⬅ Back", callback_data: "back_main" }],
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

export function cancelKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "⬅ Cancel", callback_data: "back_main" }],
      ],
    },
  };
}

export function backKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "⬅ Back", callback_data: "back_main" }],
      ],
    },
  };
}

export function providerSelectionKeyboard(sortedProviders: { key: string; label: string; hasKey: boolean }[]) {
  const rows: { text: string; callback_data: string }[][] = sortedProviders.map(p => [
    { text: `${p.hasKey ? "✅" : "⬜"} ${p.label}`, callback_data: `set_provider|${p.key}` },
  ]);
  rows.push([{ text: "⬅ Back", callback_data: "settings" }]);
  return { reply_markup: { inline_keyboard: rows } };
}

export function providerKeysKeyboard(
  _userDisplayName: string,
  providerKeys: { key: string; label: string; icon: string; exists: boolean }[]
) {
  const rows = providerKeys.map(p => [
    { text: `${p.icon} ${p.exists ? "🔄" : "➕"} ${p.label}`, callback_data: `manage_key|${p.key}` },
  ]);
  rows.push([{ text: "⬅ Back", callback_data: "settings" }]);
  return { reply_markup: { inline_keyboard: rows } };
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
