import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import tw from 'twrnc';
import { api } from '../lib/api';
import { EliteTheme } from '../constants/Theme';
import { BookOpen, ChevronRight, Layers, PlayCircle, FileText } from 'lucide-react-native';
import { Skeleton } from '../components/ui/Skeleton';

export function LibraryScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const fetchModules = async () => {
    try {
      const data = await api.get<any[]>('/mobile/modules');
      setModules(data);
    } catch (err) {
      console.warn('Failed to fetch modules:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchModules();
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[${EliteTheme.colors.background}]`}>
      <View style={tw`px-6 pt-6 pb-4 border-b border-white/10`}>
        <Text style={tw`text-2xl font-bold text-white`}>Curriculum Library</Text>
        <Text style={tw`text-slate-400 text-sm mt-1`}>Access all your modules and subjects</Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={tw`pb-32 px-6 pt-6`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={EliteTheme.colors.primary} />}
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={80} borderRadius={24} style={tw`mb-4`} />
          ))
        ) : modules.length === 0 ? (
          <View style={tw`items-center justify-center py-20`}>
            <Layers color="#475569" size={48} style={tw`mb-4`} />
            <Text style={tw`text-slate-500 text-lg font-medium`}>No modules assigned</Text>
          </View>
        ) : (
          modules.map((module) => (
            <View key={module.id} style={tw`mb-4`}>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => toggleModule(module.id)}
                style={tw`flex-row items-center justify-between p-5 bg-slate-800 border border-white/10 rounded-3xl ${expandedModule === module.id ? 'rounded-b-none border-b-0' : ''}`}
              >
                <View style={tw`flex-row items-center flex-1 pr-4`}>
                  <View style={tw`w-12 h-12 bg-white/5 rounded-xl items-center justify-center border border-white/10 mr-4`}>
                    <Layers color={EliteTheme.colors.primaryLight} size={24} />
                  </View>
                  <View>
                    <Text style={tw`text-white font-bold text-lg`}>{module.name}</Text>
                    <Text style={tw`text-slate-400 text-xs font-medium`}>{module.subjects?.length || 0} Subjects</Text>
                  </View>
                </View>
                <ChevronRight 
                  color="#64748b" 
                  size={20} 
                  style={{ transform: [{ rotate: expandedModule === module.id ? '90deg' : '0deg' }] }}
                />
              </TouchableOpacity>
              
              {expandedModule === module.id && (
                <View style={tw`bg-slate-800/50 border border-white/10 border-t-0 rounded-b-3xl overflow-hidden`}>
                  {module.subjects?.map((subject: any, index: number) => (
                    <TouchableOpacity 
                      key={subject.id}
                      onPress={() => navigation.navigate('SubjectDetail', { 
                        subjectId: subject.id, 
                        subjectTitle: subject.title,
                        subjectColor: subject.color 
                      })}
                      style={tw`flex-row items-center p-4 ${index !== module.subjects.length - 1 ? 'border-b border-white/5' : ''}`}
                    >
                      <View style={[tw`w-10 h-10 rounded-full items-center justify-center mr-4`, { backgroundColor: subject.color ? `${subject.color}20` : '#0d948820' }]}>
                        <BookOpen color={subject.color || EliteTheme.colors.primaryLight} size={18} />
                      </View>
                      <View style={tw`flex-1`}>
                        <Text style={tw`text-slate-200 font-bold text-sm`}>{subject.title}</Text>
                        <View style={tw`flex-row mt-1 items-center`}>
                          <Text style={tw`text-slate-400 text-[10px] font-medium mr-3`}>
                            {subject.lectures?.length || 0} Lectures
                          </Text>
                          {subject.lectures?.some((l: any) => l.type === 'VIDEO') && (
                            <PlayCircle color="#64748b" size={12} style={tw`mr-1`} />
                          )}
                          {subject.lectures?.some((l: any) => l.type === 'QUIZ' || l.quizId) && (
                            <FileText color="#64748b" size={12} />
                          )}
                        </View>
                      </View>
                      <ChevronRight color="#475569" size={16} />
                    </TouchableOpacity>
                  ))}
                  {(!module.subjects || module.subjects.length === 0) && (
                    <View style={tw`p-6 items-center`}>
                      <Text style={tw`text-slate-500 text-sm`}>No subjects yet</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
