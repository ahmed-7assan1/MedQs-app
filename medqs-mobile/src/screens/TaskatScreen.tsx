import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl, TextInput } from 'react-native';
import tw from 'twrnc';
import { api } from '../lib/api';
import { EliteTheme } from '../constants/Theme';
import { CheckCircle2, Circle, Plus, Calendar } from 'lucide-react-native';
import { Skeleton } from '../components/ui/Skeleton';

export function TaskatScreen({ navigation }: any) {
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

  useEffect(() => {
    fetchTasks();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
    // TODO: Send API request to toggle
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const newTask = { id: Date.now().toString(), title: newTaskText, completed: false };
    setTasks([newTask, ...tasks]);
    setNewTaskText('');
    // TODO: Send API request to add
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`px-6 pt-6 pb-4 border-b border-slate-100`}>
        <Text style={tw`text-2xl font-bold text-slate-900`}>Taskat</Text>
        <Text style={tw`text-slate-400 text-sm mt-1`}>Daily Focus & Productivity</Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={tw`pb-32 px-6 pt-6`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={EliteTheme.colors.primary} />}
      >
        {/* Progress Card */}
        <View style={tw`bg-indigo-600 p-5 rounded-3xl mb-8 shadow-lg shadow-indigo-200`}>
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <View>
               <Text style={tw`text-white/80 font-bold uppercase tracking-wider text-xs mb-1`}>Today's Progress</Text>
               <Text style={tw`text-white text-2xl font-bold`}>{completedCount} of {tasks.length} Tasks</Text>
            </View>
            <View style={tw`w-12 h-12 bg-white/20 rounded-full items-center justify-center`}>
               <Calendar color="white" size={24} />
            </View>
          </View>
          <View style={tw`h-2 bg-white/20 rounded-full overflow-hidden`}>
            <View style={[tw`h-full bg-white rounded-full`, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Add Task Input */}
        <View style={tw`flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 mb-6`}>
           <TextInput 
             placeholder="What needs to be done?"
             placeholderTextColor="#94a3b8"
             value={newTaskText}
             onChangeText={setNewTaskText}
             onSubmitEditing={addTask}
             style={tw`flex-1 text-slate-900 font-medium`}
           />
           <TouchableOpacity 
             onPress={addTask}
             style={tw`w-8 h-8 bg-indigo-500 rounded-full items-center justify-center ml-2`}
           >
              <Plus color="white" size={16} />
           </TouchableOpacity>
        </View>

        {/* Task List */}
        <Text style={tw`text-lg font-bold text-slate-900 mb-4`}>Your Tasks</Text>
        
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={60} borderRadius={16} style={tw`mb-3`} />
          ))
        ) : tasks.length === 0 ? (
          <View style={tw`items-center justify-center py-10`}>
            <Text style={tw`text-slate-400 font-medium`}>You're all caught up!</Text>
          </View>
        ) : (
          tasks.map((task) => (
            <TouchableOpacity 
              key={task.id}
              activeOpacity={0.7}
              onPress={() => toggleTask(task.id)}
              style={tw`flex-row items-center p-4 bg-white border ${task.completed ? 'border-indigo-100 bg-indigo-50/30' : 'border-slate-100'} rounded-2xl mb-3`}
            >
              <View style={tw`mr-4`}>
                 {task.completed ? (
                   <CheckCircle2 color="#6366f1" size={24} />
                 ) : (
                   <Circle color="#cbd5e1" size={24} />
                 )}
              </View>
              <Text style={[
                tw`flex-1 font-medium text-base`,
                task.completed ? tw`text-slate-400 line-through` : tw`text-slate-700`
              ]}>
                {task.title}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
