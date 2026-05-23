import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl, TextInput } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../store/useThemeStore';
import { api } from '../lib/api';
import { CheckCircle2, Circle, Plus, CalendarDays } from 'lucide-react-native';
import { Skeleton } from '../components/ui/Skeleton';

export function TaskatScreen({ navigation }: any) {
  const { getTheme, primaryColor } = useThemeStore();
  const theme = getTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  const fetchTasks = async () => {
    try {
      const data = await api.get<any[]>('/mobile/tasks');
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    setTasks([{ id: Date.now().toString(), title: newTaskText, completed: false }, ...tasks]);
    setNewTaskText('');
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}>
        <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>Taskat</Text>
        <Text style={{ color: theme.colors.textMuted, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 }}>Daily Focus & Productivity</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTasks(); }} tintColor={primaryColor} />}
      >
        {/* Progress Card */}
        <View style={{ backgroundColor: primaryColor, padding: 20, borderRadius: 24, marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, fontSize: 10, marginBottom: 4 }}>Today's Progress</Text>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: '900' }}>{completedCount} of {tasks.length}</Text>
            </View>
            <View style={{ width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
              <CalendarDays color="white" size={24} />
            </View>
          </View>
          <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ height: '100%', backgroundColor: 'white', borderRadius: 3, width: `${progress}%` }} />
          </View>
        </View>

        {/* Add Task */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 20, paddingLeft: 16, paddingRight: 4, paddingVertical: 4, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 24 }}>
          <TextInput
            placeholder="What needs to be done?"
            placeholderTextColor={theme.colors.textMuted}
            value={newTaskText}
            onChangeText={setNewTaskText}
            onSubmitEditing={addTask}
            style={{ flex: 1, height: 44, color: theme.colors.text, fontWeight: '600', fontSize: 14 }}
          />
          <TouchableOpacity
            onPress={addTask}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: primaryColor, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}
          >
            <Plus color="white" size={16} />
          </TouchableOpacity>
        </View>

        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900', marginBottom: 16 }}>Your Tasks</Text>

        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} mb={3} height={56} borderRadius={16} />)
        ) : tasks.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
            <CalendarDays color={theme.colors.border} size={40} style={{ marginBottom: 12 }} />
            <Text style={{ color: theme.colors.textMuted, fontWeight: '700', fontSize: 15 }}>You're all caught up!</Text>
          </View>
        ) : (
          tasks.map((task, i) => (
            <Animated.View key={task.id} entering={FadeInDown.delay(i * 50)}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleTask(task.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  padding: 16, backgroundColor: theme.colors.surface,
                  borderRadius: 20, marginBottom: 10,
                  borderWidth: 1, borderColor: task.completed ? primaryColor + '30' : theme.colors.border,
                }}
              >
                <View style={{ marginRight: 14 }}>
                  {task.completed ? <CheckCircle2 color={primaryColor} size={22} /> : <Circle color={theme.colors.textMuted} size={22} />}
                </View>
                <Text style={{
                  flex: 1, fontWeight: '600', fontSize: 14,
                  color: task.completed ? theme.colors.textMuted : theme.colors.text,
                  textDecorationLine: task.completed ? 'line-through' : 'none',
                  opacity: task.completed ? 0.5 : 1,
                }}>
                  {task.title}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}