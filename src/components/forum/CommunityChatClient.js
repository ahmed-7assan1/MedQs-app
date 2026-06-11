"use client";
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityChatClient = CommunityChatClient;
var react_1 = require("react");
var MessageBubble_1 = require("./MessageBubble");
var VoiceRecorder_1 = require("./VoiceRecorder");
var react_2 = require("@phosphor-icons/react");
var framer_motion_1 = require("framer-motion");
var react_hot_toast_1 = require("react-hot-toast");
function CommunityChatClient(_a) {
    var _this = this;
    var _b;
    var currentUserId = _a.currentUserId, currentUserName = _a.currentUserName, currentUserImage = _a.currentUserImage, universityName = _a.universityName, initialMessages = _a.initialMessages;
    var _c = (0, react_1.useState)(initialMessages), messages = _c[0], setMessages = _c[1];
    var _d = (0, react_1.useState)(""), text = _d[0], setText = _d[1];
    var _e = (0, react_1.useState)([]), attachments = _e[0], setAttachments = _e[1];
    var _f = (0, react_1.useState)(false), isSending = _f[0], setIsSending = _f[1];
    var _g = (0, react_1.useState)(false), isUploading = _g[0], setIsUploading = _g[1];
    var _h = (0, react_1.useState)(false), isRecording = _h[0], setIsRecording = _h[1];
    var _j = (0, react_1.useState)(false), showScrollDown = _j[0], setShowScrollDown = _j[1];
    var _k = (0, react_1.useState)(true), isAtBottom = _k[0], setIsAtBottom = _k[1];
    var bottomRef = (0, react_1.useRef)(null);
    var scrollRef = (0, react_1.useRef)(null);
    var pollingRef = (0, react_1.useRef)(null);
    var latestIdRef = (0, react_1.useRef)(((_b = initialMessages[initialMessages.length - 1]) === null || _b === void 0 ? void 0 : _b.id) || "");
    var textareaRef = (0, react_1.useRef)(null);
    // ──────────────────────────────────────────────────────────────────
    // Scroll helpers
    // ──────────────────────────────────────────────────────────────────
    var scrollToBottom = (0, react_1.useCallback)(function (smooth) {
        var _a;
        if (smooth === void 0) { smooth = true; }
        (_a = bottomRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
    }, []);
    (0, react_1.useEffect)(function () {
        scrollToBottom(false);
    }, []);
    var handleScroll = function () {
        var el = scrollRef.current;
        if (!el)
            return;
        var distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        setIsAtBottom(distFromBottom < 80);
        setShowScrollDown(distFromBottom > 200);
    };
    // ──────────────────────────────────────────────────────────────────
    // Real-time Messages via Puter.js Event Broker (Zero DB Load)
    // ──────────────────────────────────────────────────────────────────
    (0, react_1.useEffect)(function () {
        var puterUnsubscribe = null;
        var channel = "community-chat-".concat(universityName || "global");
        var setupRealtime = function () { return __awaiter(_this, void 0, void 0, function () {
            var e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(typeof window !== "undefined" && window.puter)) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, window.puter.broker.subscribe(channel, function (data) {
                                if (data && data.id && data.author) {
                                    // Only add if we don't already have it (from our own send)
                                    setMessages(function (prev) {
                                        if (prev.some(function (m) { return m.id === data.id; }))
                                            return prev;
                                        var updated = __spreadArray(__spreadArray([], prev, true), [data], false);
                                        latestIdRef.current = data.id;
                                        setTimeout(function () { return scrollToBottom(); }, 50);
                                        return updated;
                                    });
                                }
                            })];
                    case 2:
                        puterUnsubscribe = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        console.error("Puter realtime setup failed:", e_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        setupRealtime();
        return function () {
            if (puterUnsubscribe)
                puterUnsubscribe();
        };
    }, [universityName, scrollToBottom]);
    // ──────────────────────────────────────────────────────────────────
    // Send message
    // ──────────────────────────────────────────────────────────────────
    var handleSend = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, data_1, channel, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!text.trim() && attachments.length === 0)
                        return [2 /*return*/];
                    setIsSending(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("/api/v1/community/messages", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ content: text.trim(), attachments: attachments }),
                        })];
                case 2:
                    res = _b.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    data_1 = _b.sent();
                    if (data_1.message) {
                        setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [data_1.message], false); });
                        setText("");
                        setAttachments([]);
                        if (textareaRef.current)
                            textareaRef.current.style.height = "auto";
                        setTimeout(function () { return scrollToBottom(); }, 50);
                        // Broadcast to peers
                        if (typeof window !== "undefined" && window.puter) {
                            channel = "community-chat-".concat(universityName || "global");
                            window.puter.broker.publish(channel, data_1.message);
                        }
                    }
                    return [3 /*break*/, 6];
                case 4:
                    _a = _b.sent();
                    react_hot_toast_1.default.error("Failed to send message");
                    return [3 /*break*/, 6];
                case 5:
                    setIsSending(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleKeyDown = function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    // ──────────────────────────────────────────────────────────────────
    // File upload to Telegram
    // ──────────────────────────────────────────────────────────────────
    var uploadToTelegram = function (file, name) { return __awaiter(_this, void 0, void 0, function () {
        var fd, fileName, res, data, type;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    fd = new FormData();
                    fileName = name || (file instanceof File ? file.name : "file_".concat(Date.now()));
                    fd.append("file", file, fileName);
                    return [4 /*yield*/, fetch("/api/v1/debug/telegram-direct-upload", { method: "POST", body: fd })];
                case 1:
                    res = _c.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _c.sent();
                    if (!data.success)
                        throw new Error("Upload failed");
                    type = "file";
                    if ((_a = file.type) === null || _a === void 0 ? void 0 : _a.startsWith("image/"))
                        type = "image";
                    else if ((_b = file.type) === null || _b === void 0 ? void 0 : _b.startsWith("audio/"))
                        type = "audio";
                    return [2 /*return*/, {
                            url: "/api/v1/files/telegram/preview?fileId=".concat(data.fileId, "&type=").concat(type),
                            type: type,
                            fileId: data.fileId,
                        }];
            }
        });
    }); };
    var handleFileInput = function (e, accept) { return __awaiter(_this, void 0, void 0, function () {
        var files, results_1, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    files = Array.from(e.target.files || []);
                    if (!files.length)
                        return [2 /*return*/];
                    setIsUploading(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, Promise.all(files.map(function (f) { return uploadToTelegram(f); }))];
                case 2:
                    results_1 = _b.sent();
                    setAttachments(function (prev) { return __spreadArray(__spreadArray([], prev, true), results_1, true); });
                    return [3 /*break*/, 5];
                case 3:
                    _a = _b.sent();
                    react_hot_toast_1.default.error("Upload failed. Try again.");
                    return [3 /*break*/, 5];
                case 4:
                    setIsUploading(false);
                    e.target.value = "";
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleVoiceStop = function (blob) { return __awaiter(_this, void 0, void 0, function () {
        var att, res, data_2, channel, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setIsRecording(false);
                    setIsUploading(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, uploadToTelegram(blob, "voice_".concat(Date.now(), ".webm"))];
                case 2:
                    att = _b.sent();
                    return [4 /*yield*/, fetch("/api/v1/community/messages", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ content: "", attachments: [att] }),
                        })];
                case 3:
                    res = _b.sent();
                    return [4 /*yield*/, res.json()];
                case 4:
                    data_2 = _b.sent();
                    if (data_2.message) {
                        setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [data_2.message], false); });
                        setTimeout(function () { return scrollToBottom(); }, 50);
                        // Broadcast to peers
                        if (typeof window !== "undefined" && window.puter) {
                            channel = "community-chat-".concat(universityName || "global");
                            window.puter.broker.publish(channel, data_2.message);
                        }
                    }
                    return [3 /*break*/, 7];
                case 5:
                    _a = _b.sent();
                    react_hot_toast_1.default.error("Failed to send voice note");
                    return [3 /*break*/, 7];
                case 6:
                    setIsUploading(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var removeAttachment = function (i) {
        return setAttachments(function (prev) { return prev.filter(function (_, idx) { return idx !== i; }); });
    };
    // Auto-grow textarea
    var handleTextChange = function (e) {
        setText(e.target.value);
        var el = e.target;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 140) + "px";
    };
    // ──────────────────────────────────────────────────────────────────
    // Group messages by date
    // ──────────────────────────────────────────────────────────────────
    var grouped = messages.reduce(function (acc, msg) {
        var label = new Date(msg.createdAt).toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
        });
        var last = acc[acc.length - 1];
        if (!last || last.label !== label)
            acc.push({ label: label, items: [msg] });
        else
            last.items.push(msg);
        return acc;
    }, []);
    return (<div className="flex flex-col h-[100dvh] bg-[#0B0A14] overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center gap-4 px-4 py-3 bg-[#12101E]/90 border-b border-white/[0.05] backdrop-blur-2xl">
        <div className="relative h-11 w-11 shrink-0">
          <div className="h-full w-full rounded-2xl bg-gradient-to-br from-[#534AB7] to-[#AFA9EC] flex items-center justify-center shadow-lg">
            <react_2.Users size={22} weight="fill" className="text-white"/>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-[#12101E]"/>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-black text-white tracking-tight truncate">
            {universityName || "Community"} · Discussion
          </h1>
          <p className="text-[11px] text-white/30 font-bold">All members • Tap to send</p>
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 no-scrollbar" style={{ backgroundImage: "radial-gradient(ellipse at top, #1a1530 0%, #0B0A14 70%)" }}>
        {messages.length === 0 && (<div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
            <react_2.Users size={56} className="text-white"/>
            <p className="text-white font-black text-lg">No messages yet</p>
            <p className="text-white/50 text-sm text-center">Be the first to say something to the group!</p>
          </div>)}

        {grouped.map(function (_a) {
            var label = _a.label, items = _a.items;
            return (<div key={label}>
            {/* Date separator */}
            <div className="flex items-center justify-center py-3">
              <div className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.05]">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{label}</span>
              </div>
            </div>

            {items.map(function (msg) { return (<MessageBubble_1.MessageBubble key={msg.id} message={msg} isMine={msg.author.id === currentUserId}/>); })}
          </div>);
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Scroll to bottom button */}
      <framer_motion_1.AnimatePresence>
        {showScrollDown && (<framer_motion_1.motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} onClick={function () { return scrollToBottom(); }} className="absolute bottom-24 right-5 h-10 w-10 rounded-full bg-[#534AB7] text-white flex items-center justify-center shadow-2xl shadow-[#534AB7]/40 z-20">
            <react_2.ArrowDown size={20} weight="bold"/>
          </framer_motion_1.motion.button>)}
      </framer_motion_1.AnimatePresence>

      {/* ── Composer ── */}
      <div className="flex-shrink-0 border-t border-white/[0.05] bg-[#12101E]/95 backdrop-blur-2xl px-3 py-3">
        {/* Voice Recorder Mode */}
        <framer_motion_1.AnimatePresence>
          {isRecording && (<framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="mb-3">
              <VoiceRecorder_1.VoiceRecorder onStop={handleVoiceStop} onCancel={function () { return setIsRecording(false); }}/>
            </framer_motion_1.motion.div>)}
        </framer_motion_1.AnimatePresence>

        {/* Attachments Preview */}
        {attachments.length > 0 && (<div className="flex gap-2 mb-3 flex-wrap">
            {attachments.map(function (a, i) { return (<div key={i} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/20">
                {a.type === "image" ? (<img src={a.url} alt="" className="h-16 w-16 object-cover"/>) : a.type === "audio" ? (<div className="h-16 w-16 flex flex-col items-center justify-center bg-[#534AB7]/20">
                    <react_2.Microphone size={20} weight="fill" className="text-[#AFA9EC]"/>
                    <span className="text-[8px] font-black text-white/50 mt-1">Voice</span>
                  </div>) : (<div className="h-16 w-16 flex flex-col items-center justify-center bg-white/5">
                    <react_2.DownloadSimple size={20} weight="bold" className="text-[#AFA9EC]"/>
                    <span className="text-[8px] font-black text-white/40 mt-1">File</span>
                  </div>)}
                <button onClick={function () { return removeAttachment(i); }} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <react_2.X size={10} weight="bold" className="text-white"/>
                </button>
              </div>); })}
          </div>)}

        {/* Input Row */}
        {!isRecording && (<div className="flex items-end gap-2">
            {/* Attach buttons */}
            <div className="flex gap-1.5 pb-2">
              <label className="h-9 w-9 flex items-center justify-center rounded-2xl text-white/30 hover:text-[#AFA9EC] hover:bg-[#534AB7]/10 transition-all cursor-pointer">
                <react_2.Image size={20} weight="bold"/>
                <input type="file" accept="image/*" multiple className="hidden" onChange={function (e) { return handleFileInput(e, "image/*"); }} disabled={isUploading}/>
              </label>
              <label className="h-9 w-9 flex items-center justify-center rounded-2xl text-white/30 hover:text-[#AFA9EC] hover:bg-[#534AB7]/10 transition-all cursor-pointer">
                <react_2.Paperclip size={20} weight="bold"/>
                <input type="file" multiple className="hidden" onChange={function (e) { return handleFileInput(e, "*/*"); }} disabled={isUploading}/>
              </label>
            </div>

            {/* Text input */}
            <div className="flex-1 flex items-end bg-white/[0.04] border border-white/[0.07] rounded-[22px] overflow-hidden px-4 py-2.5">
              <textarea ref={textareaRef} value={text} onChange={handleTextChange} onKeyDown={handleKeyDown} placeholder="Message..." rows={1} className="w-full bg-transparent resize-none text-[14px] text-white placeholder:text-white/20 focus:outline-none font-medium leading-relaxed max-h-[140px] overflow-y-auto no-scrollbar"/>
            </div>

            {/* Send / Mic */}
            <div className="pb-1">
              {text.trim() || attachments.length > 0 ? (<button onClick={handleSend} disabled={isSending} className="h-10 w-10 rounded-2xl bg-[#534AB7] text-white flex items-center justify-center shadow-lg shadow-[#534AB7]/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                  {isSending || isUploading ? (<react_2.CircleNotch size={20} weight="bold" className="animate-spin"/>) : (<react_2.PaperPlaneTilt size={20} weight="fill" className="ml-0.5"/>)}
                </button>) : (<button onClick={function () { return setIsRecording(true); }} className="h-10 w-10 rounded-2xl bg-white/[0.06] border border-white/[0.07] text-white/40 hover:text-[#AFA9EC] hover:bg-[#534AB7]/10 flex items-center justify-center transition-all">
                  <react_2.Microphone size={20} weight="bold"/>
                </button>)}
            </div>
          </div>)}

        {/* Uploading indicator */}
        {isUploading && (<div className="flex items-center gap-2 mt-2 ml-2">
            <react_2.CircleNotch size={14} weight="bold" className="animate-spin text-[#AFA9EC]"/>
            <span className="text-[11px] font-bold text-white/30">Uploading to secure storage...</span>
          </div>)}
      </div>
    </div>);
}
