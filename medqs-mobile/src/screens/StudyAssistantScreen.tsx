import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Image, StatusBar, ImageBackground, Alert
} from 'react-native';
import tw from 'twrnc';
import Animated, {
  FadeIn, FadeInDown, FadeInRight, FadeInUp,
  useSharedValue, useAnimatedStyle, withSpring, withTiming
} from 'react-native-reanimated';
import {
  Brain, Send, Sparkles, Calendar,
  Image as ImageIcon, ChevronLeft,
  MessageSquare, Clock, CheckCircle2,
  AlertCircle, RefreshCw, TrendingUp, Settings, Copy, Check, X
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Markdown from 'react-native-markdown-display';
import { useChatConfigStore } from '../store/useChatConfigStore';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { mobileApi } from '../lib/api';
import * as Haptics from 'expo-haptics';

// ─── Types ────────────────────────────────────────────────────────────────────
type Message = { role: 'user' | 'assistant'; content: string };

// ─── Animated Send Button ─────────────────────────────────────────────────────
function SendButton({ onPress, disabled, color }: { onPress: () => void; disabled: boolean; color: string }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSpring(0.85, {}, () => { scale.value = withSpring(1); });
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} disabled={disabled}>
      <Animated.View
        style={[
          tw`p-3 rounded-xl ml-2`,
          animStyle,
          { backgroundColor: disabled ? 'transparent' : color }
        ]}
      >
        <Send color={disabled ? '#374151' : 'white'} size={18} strokeWidth={3} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────
function ChatBubble({ msg, idx, color }: { msg: Message; idx: number; color: string }) {
  const isUser = msg.role === 'user';
  const { bubbleColor, userBubbleColor } = useChatConfigStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(msg.content);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  const bgAssistant = bubbleColor === 'white/5' ? 'rgba(255,255,255,0.05)' : bubbleColor;
  
  return (
    <Animated.View
      entering={FadeInDown.delay(50).springify()}
      style={[
        tw`mb-4 max-w-[88%] rounded-3xl p-4`,
        isUser
          ? [tw`self-end border border-[#1E2D4D]`, { backgroundColor: userBubbleColor, borderBottomRightRadius: 6 }]
          : [tw`self-start border border-white/10`, { backgroundColor: bgAssistant, borderBottomLeftRadius: 6 }]
      ]}
    >
      {!isUser && (
        <View style={tw`flex-row items-center justify-between mb-2`}>
          <View style={tw`flex-row items-center`}>
            <Sparkles color={color} size={13} style={tw`mr-1.5`} />
            <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color }]}>
              MedOneX AI
            </Text>
          </View>
          <TouchableOpacity onPress={handleCopy} style={tw`p-1`}>
            {copied ? <Check color="#10B981" size={14} /> : <Copy color="#6B7280" size={14} />}
          </TouchableOpacity>
        </View>
      )}
      {isUser ? (
        <Text style={tw`text-white text-[15px] leading-6 font-medium`}>{msg.content}</Text>
      ) : (
        <Markdown style={{ 
          body: tw`text-white text-[15px] leading-6 font-medium`,
          code_block: tw`bg-black/30 p-3 rounded-lg border border-white/10 mt-2 mb-2`,
          code_inline: tw`bg-black/30 px-1.5 py-0.5 rounded text-white`,
          strong: tw`text-white font-black`,
          em: tw`text-white font-bold italic`
        }}>
          {msg.content}
        </Markdown>
      )}
    </Animated.View>
  );
}

// ─── Usage Bar ────────────────────────────────────────────────────────────────
function UsageBar({ used, limit, color }: { used: number; limit: number; color: string }) {
  if (limit === -1) return (
    <View style={tw`flex-row items-center px-4 py-2`}>
      <TrendingUp color={color} size={12} style={tw`mr-1`} />
      <Text style={[tw`text-xs font-black`, { color }]}>Unlimited messages</Text>
    </View>
  );
  const pct = Math.min((used / limit) * 100, 100);
  return (
    <View style={tw`px-4 py-2`}>
      <View style={tw`flex-row justify-between mb-1`}>
        <Text style={tw`text-slate-500 text-[10px] font-bold`}>Daily messages</Text>
        <Text style={tw`text-slate-500 text-[10px] font-bold`}>{used}/{limit}</Text>
      </View>
      <View style={tw`h-1 bg-white/5 rounded-full overflow-hidden`}>
        <View style={[tw`h-full rounded-full`, { width: `${pct}%`, backgroundColor: pct > 80 ? '#ef4444' : color }]} />
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function StudyAssistantScreen({ navigation }: any) {
  const { primaryColor } = useThemeStore();
  const { user } = useAuthStore();
  const { backgroundImage, userBubbleColor, bubbleColor, setBackgroundImage, setBubbleColor, setUserBubbleColor } = useChatConfigStore();
  const [activeTab, setActiveTab] = useState<'chat' | 'plan'>('chat');
  const [message, setMessage] = useState('');
  
  const isAdmin = user?.role === 'ADMIN';
  const [puterModel, setPuterModel] = useState('gpt-4o');
  const [showSettings, setShowSettings] = useState(false);

  const [chat, setChat] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm your MedOneX AI Study Assistant.\n\nI can help you:\n• Explain complex medical concepts\n• Create personalized study plans\n• Review weak areas from your quiz history\n• Answer questions about your lectures\n\nWhat would you like to study today?`
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<{ used: number; limit: number; rankLabel: string } | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // ── Fetch usage + tasks on mount ──────────────────────────────────────────
  useEffect(() => {
    // Fetch today's tasks for the plan tab
    setTasksLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    mobileApi.getTasks(today)
      .then(t => setTasks(t || []))
      .catch(() => setTasks([]))
      .finally(() => setTasksLoading(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [chat, loading]);

  // ── Send Message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const userMsg = message.trim();
    if (!userMsg || loading) return;

    setMessage('');
    const newChat: Message[] = [...chat, { role: 'user', content: userMsg }];
    setChat(newChat);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Send the full conversation history for context
      const result = await mobileApi.sendAiMessage(
        newChat.map(m => ({ role: m.role, content: m.content })),
        isAdmin ? puterModel : undefined
      );

      setChat(prev => [...prev, { role: 'assistant', content: result.reply }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Update usage
      if (result.used !== undefined && result.limit !== undefined) {
        setUsage({ used: result.used, limit: result.limit, rankLabel: result.rankLabel || 'Newbie' });
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Could not reach the AI. Check your connection and try again.';
      if (err?.status === 429) {
        setChat(prev => [
          ...prev,
          { role: 'assistant', content: `⚠️ You've reached your daily message limit. Earn more points to unlock a higher rank with more daily messages!` }
        ]);
      } else {
        setChat(prev => [
          ...prev,
          { role: 'assistant', content: `❌ Error: ${errMsg}` }
        ]);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [message, loading, chat]);

  const clearChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChat([{
      role: 'assistant',
      content: `Chat cleared! How can I help you continue your studies?`
    }]);
  };

  const toggleTask = async (task: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newCompleted = !task.completed;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: newCompleted } : t));
    try {
      await mobileApi.toggleTask(task.id, newCompleted);
    } catch {
      // Revert on error
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: task.completed } : t));
    }
  };

  const QUICK_PROMPTS = [
    'Explain heart sounds to me',
    'Quiz me on cranial nerves',
    'What should I study today?',
    'Summarize my weak areas',
  ];

  const AVAILABLE_MODELS = [
    'gpt-4o', 'claude-3-7-sonnet-20250219', 'gemini-2.5-pro',
    'deepseek-chat', 'o3-mini', 'llama-3.3-70b-versatile'
  ];

  return (
    <View style={tw`flex-1 bg-black`}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={backgroundImage ? { uri: backgroundImage } : require('../../assets/medical_login_bg.png')}
        style={tw`flex-1`}
        imageStyle={{ opacity: backgroundImage ? 0.3 : 0.1 }}
      >
        <SafeAreaView style={tw`flex-1`}>

          {/* Header */}
          <Animated.View entering={FadeInDown} style={tw`px-6 pt-4 pb-4 flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
                style={tw`p-2.5 bg-white/5 rounded-xl mr-4 border border-white/10`}
              >
                <ChevronLeft color="white" size={20} />
              </TouchableOpacity>
              <View>
                <Text style={tw`text-white text-xl font-black`}>Study Assistant</Text>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`w-2 h-2 rounded-full bg-green-400 mr-2`} />
                  <Text style={tw`text-slate-400 text-xs font-bold uppercase tracking-widest`}>AI Online</Text>
                </View>
              </View>
            </View>
            <View style={tw`flex-row`}>
              <TouchableOpacity
                onPress={() => { setShowSettings(!showSettings); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                activeOpacity={0.8}
                style={tw`p-2.5 bg-white/5 rounded-xl border border-white/10 mr-2`}
              >
                <Settings color="white" size={18} />
              </TouchableOpacity>
              {activeTab === 'chat' && (
                <TouchableOpacity
                  onPress={clearChat}
                  activeOpacity={0.8}
                  style={tw`p-2.5 bg-white/5 rounded-xl border border-white/10 mr-2`}
                >
                  <RefreshCw color="#4B5563" size={18} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => { setActiveTab('plan'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                activeOpacity={0.8}
                style={tw`p-2.5 bg-white/5 rounded-xl border border-white/10`}
              >
                <Calendar color="white" size={18} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Tabs */}
          <Animated.View entering={FadeInDown.delay(80)} style={tw`flex-row px-6 mb-4`}>
            {(['chat', 'plan'] as const).map((tab, i) => (
              <TouchableOpacity
                key={tab}
                onPress={() => { setActiveTab(tab); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                activeOpacity={0.8}
                style={[
                  tw`flex-1 py-3 items-center rounded-2xl flex-row justify-center`,
                  i === 0 ? tw`mr-2` : {},
                  activeTab === tab
                    ? { backgroundColor: primaryColor }
                    : tw`bg-white/5 border border-white/10`
                ]}
              >
                {tab === 'chat'
                  ? <MessageSquare color="white" size={17} style={tw`mr-2`} />
                  : <Clock color="white" size={17} style={tw`mr-2`} />
                }
                <Text style={tw`text-white font-black text-sm`}>
                  {tab === 'chat' ? 'AI Chat' : "Today's Plan"}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* ── Chat Tab ─────────────────────────────────────────────────── */}
          {activeTab === 'chat' ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={tw`flex-1`}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
              {showSettings && (
                <Animated.View entering={FadeInUp} style={tw`px-6 mb-4`}>
                  <View style={tw`bg-[#0D1117] p-5 rounded-3xl border border-[#1E2D4D]`}>
                    <View style={tw`flex-row justify-between items-center mb-4`}>
                      <Text style={tw`text-white font-black text-lg`}>Chat Settings</Text>
                      <TouchableOpacity onPress={() => setShowSettings(false)}>
                        <X color="white" size={20} />
                      </TouchableOpacity>
                    </View>

                    {isAdmin && (
                      <View style={tw`mb-5`}>
                        <Text style={tw`text-slate-400 text-xs font-bold uppercase tracking-widest mb-2`}>Admin: Puter Model</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {AVAILABLE_MODELS.map(m => (
                            <TouchableOpacity
                              key={m}
                              onPress={() => { setPuterModel(m); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                              style={[tw`px-4 py-2 rounded-xl mr-2 border`, puterModel === m ? [tw`border-transparent`, {backgroundColor: primaryColor}] : tw`bg-white/5 border-white/10`]}
                            >
                              <Text style={[tw`font-bold`, puterModel === m ? tw`text-white` : tw`text-slate-400`]}>{m}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    <View>
                      <Text style={tw`text-slate-400 text-xs font-bold uppercase tracking-widest mb-2`}>Customization</Text>
                      <View style={tw`flex-row justify-between items-center`}>
                        <TouchableOpacity onPress={() => setBackgroundImage(backgroundImage ? null : 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop')} style={tw`bg-white/5 px-4 py-2 rounded-xl border border-white/10`}>
                          <Text style={tw`text-white font-bold text-xs`}>{backgroundImage ? 'Remove Background' : 'Set Background'}</Text>
                        </TouchableOpacity>
                        
                        <View style={tw`flex-row gap-2`}>
                          <TouchableOpacity onPress={() => setUserBubbleColor('#2563EB')} style={[tw`w-8 h-8 rounded-full border border-white/20`, {backgroundColor: '#2563EB'}]} />
                          <TouchableOpacity onPress={() => setUserBubbleColor('#059669')} style={[tw`w-8 h-8 rounded-full border border-white/20`, {backgroundColor: '#059669'}]} />
                          <TouchableOpacity onPress={() => setUserBubbleColor('#111827')} style={[tw`w-8 h-8 rounded-full border border-white/20`, {backgroundColor: '#111827'}]} />
                        </View>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              )}

              <ScrollView
                ref={scrollRef}
                style={tw`flex-1 px-6`}
                contentContainerStyle={tw`pb-4`}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {chat.map((msg, i) => (
                  <ChatBubble key={i} msg={msg} idx={i} color={primaryColor} />
                ))}

                {loading && (
                  <View style={tw`self-start bg-white/5 rounded-3xl p-4 mb-4 border border-white/10 flex-row items-center`}>
                    <ActivityIndicator color={primaryColor} size="small" style={tw`mr-3`} />
                    <Text style={tw`text-slate-500 text-sm font-bold`}>Thinking...</Text>
                  </View>
                )}
              </ScrollView>

              {/* Quick prompt chips */}
              {chat.length <= 1 && !loading && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={tw`px-6 pb-2`}
                >
                  {QUICK_PROMPTS.map((p, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => { setMessage(p); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      activeOpacity={0.8}
                      style={tw`bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl mr-3`}
                    >
                      <Text style={tw`text-slate-300 text-xs font-bold`}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Usage bar */}
              {usage && <UsageBar used={usage.used} limit={usage.limit} color={primaryColor} />}

              {/* Input */}
              <View style={tw`px-6 py-3 bg-black/50 border-t border-white/5`}>
                <View style={tw`flex-row items-end bg-white/5 border border-white/10 rounded-2xl px-4 py-2`}>
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Ask anything medical..."
                    placeholderTextColor="#4B5563"
                    multiline
                    style={tw`flex-1 text-white py-2 max-h-32 font-semibold text-[15px]`}
                    onSubmitEditing={sendMessage}
                    blurOnSubmit={false}
                  />
                  <SendButton
                    onPress={sendMessage}
                    disabled={!message.trim() || loading}
                    color={primaryColor}
                  />
                </View>
              </View>
            </KeyboardAvoidingView>

          ) : (
            /* ── Plan Tab ──────────────────────────────────────────────── */
            <ScrollView style={tw`flex-1 px-6`} showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-32`}>
              {/* Header card */}
              <Animated.View entering={FadeInDown} style={tw`bg-[#0D1117] p-6 rounded-[28px] border border-[#1E2D4D] mb-6`}>
                <View style={tw`flex-row items-center mb-5`}>
                  <View style={[tw`w-12 h-12 rounded-2xl items-center justify-center mr-4`, { backgroundColor: primaryColor + '20' }]}>
                    <Calendar color={primaryColor} size={24} />
                  </View>
                  <View>
                    <Text style={tw`text-white text-lg font-black`}>Today's Tasks</Text>
                    <Text style={tw`text-slate-500 text-xs font-bold`}>
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>

                {tasksLoading ? (
                  <ActivityIndicator color={primaryColor} style={tw`my-4`} />
                ) : tasks.length === 0 ? (
                  <View style={tw`items-center py-6`}>
                    <Calendar color="#1E2D4D" size={40} style={tw`mb-3`} />
                    <Text style={tw`text-slate-600 font-bold text-center`}>No tasks for today</Text>
                    <Text style={tw`text-slate-700 text-xs text-center mt-1`}>Use AI Chat to generate your study plan</Text>
                  </View>
                ) : (
                  <View>
                    {tasks.map((task, i) => (
                      <Animated.View
                        key={task.id}
                        entering={FadeInDown.delay(i * 60)}
                        style={tw`flex-row items-center bg-white/[0.03] p-4 rounded-2xl border border-white/5 mb-3`}
                      >
                        <TouchableOpacity
                          onPress={() => toggleTask(task)}
                          activeOpacity={0.8}
                          style={tw`mr-3`}
                        >
                          {task.completed
                            ? <CheckCircle2 color={primaryColor} size={22} />
                            : <View style={tw`w-6 h-6 rounded-full border-2 border-white/20`} />
                          }
                        </TouchableOpacity>
                        <View style={tw`flex-1`}>
                          <Text style={[
                            tw`text-white font-bold`,
                            task.completed && tw`text-slate-600 line-through`
                          ]}>
                            {task.title}
                          </Text>
                          {task.time && (
                            <Text style={tw`text-slate-500 text-[10px] mt-0.5`}>{task.time}</Text>
                          )}
                        </View>
                        {task.completed
                          ? <CheckCircle2 color={primaryColor} size={18} />
                          : <Clock color="#3B4A6B" size={18} />
                        }
                      </Animated.View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => { setActiveTab('chat'); setMessage('Generate a study plan for today based on my weak areas'); }}
                  activeOpacity={0.85}
                  style={[tw`mt-4 py-4 rounded-2xl items-center flex-row justify-center`, { backgroundColor: primaryColor }]}
                >
                  <Sparkles color="white" size={18} style={tw`mr-2`} />
                  <Text style={tw`text-white font-black`}>Generate AI Study Plan</Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Analyze Schedule */}
              <Animated.View entering={FadeInDown.delay(120)}>
                <TouchableOpacity
                  onPress={() => { setActiveTab('chat'); setMessage('Analyze my current progress and tell me what to focus on'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                  activeOpacity={0.85}
                  style={tw`bg-white/5 p-6 rounded-[28px] border border-white/10 flex-row items-center`}
                >
                  <View style={tw`w-14 h-14 bg-teal-500/10 rounded-2xl items-center justify-center mr-4`}>
                    <Sparkles color="#2dd4bf" size={28} />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-white font-black text-lg`}>Analyze My Progress</Text>
                    <Text style={tw`text-slate-500 text-xs`}>AI reviews quiz history & weak areas</Text>
                  </View>
                  <ChevronLeft color="#3B4A6B" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
              </Animated.View>
            </ScrollView>
          )}
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}
