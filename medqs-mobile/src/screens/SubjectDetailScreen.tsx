import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Linking } from 'react-native';
import tw from 'twrnc';
import { api } from '../lib/api';
import { EliteTheme } from '../constants/Theme';
import { ChevronLeft, PlayCircle, FileText, Clock, ExternalLink } from 'lucide-react-native';

export function SubjectDetailScreen({ route, navigation }: any) {
  const { subjectId, subjectTitle, subjectColor } = route.params;
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<any>(null);

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const data = await api.get<any>(`/mobile/subjects/${subjectId}`);
        setSubject(data);
      } catch (err) {
        console.warn('Failed to fetch subject details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubject();
  }, [subjectId]);

  const handleOpenLink = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[${EliteTheme.colors.background}]`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-4 py-4 border-b border-white/10`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 bg-white/5 rounded-full border border-white/10`}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={tw`text-lg font-bold text-white flex-1 text-center truncate px-2`} numberOfLines={1}>
          {subjectTitle}
        </Text>
        <View style={tw`w-10`} /> {/* Spacer for centering */}
      </View>

      {loading ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color={subjectColor || EliteTheme.colors.primaryLight} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={tw`pb-32 px-6 pt-6`}>
          <View style={[tw`w-16 h-16 rounded-2xl items-center justify-center mb-6 border border-white/10`, { backgroundColor: subjectColor ? `${subjectColor}20` : '#0d948820' }]}>
             <FileText color={subjectColor || EliteTheme.colors.primaryLight} size={32} />
          </View>
          <Text style={tw`text-3xl font-extrabold text-white mb-2`}>{subject.title}</Text>
          <Text style={tw`text-slate-400 font-medium mb-8`}>{subject.module?.name}</Text>

          <Text style={tw`text-xl font-bold text-white mb-4`}>Lectures ({subject.lectures?.length || 0})</Text>

          {(!subject.lectures || subject.lectures.length === 0) ? (
            <View style={tw`py-10 items-center bg-slate-800 rounded-3xl border border-white/10`}>
              <Text style={tw`text-slate-500 font-medium`}>No lectures available yet.</Text>
            </View>
          ) : (
            subject.lectures.map((lecture: any, index: number) => (
              <TouchableOpacity 
                key={lecture.id}
                style={tw`flex-row p-4 mb-4 bg-slate-800 border border-white/10 rounded-2xl shadow-sm shadow-slate-900`}
                activeOpacity={0.7}
                onPress={() => {
                  navigation.navigate('LectureDetail', {
                    lectureId: lecture.id,
                    lectureTitle: lecture.title,
                    subjectTitle: subject.title
                  });
                }}
              >
                <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-4`, { backgroundColor: lecture.type === 'VIDEO' ? '#ef444420' : '#22c55e20' }]}>
                  {lecture.type === 'VIDEO' ? (
                    <PlayCircle color="#f87171" size={24} />
                  ) : (
                    <FileText color="#4ade80" size={24} />
                  )}
                </View>
                
                <View style={tw`flex-1 justify-center`}>
                  <Text style={tw`text-white font-bold text-base mb-1`}>{lecture.title}</Text>
                  <View style={tw`flex-row items-center`}>
                    {lecture.duration && (
                      <View style={tw`flex-row items-center mr-3`}>
                        <Clock color="#64748b" size={12} style={tw`mr-1`} />
                        <Text style={tw`text-slate-400 text-xs font-medium`}>{lecture.duration} mins</Text>
                      </View>
                    )}
                    <View style={tw`bg-white/10 px-2 py-0.5 rounded-full border border-white/5`}>
                      <Text style={tw`text-slate-300 text-[10px] font-bold uppercase`}>{lecture.type}</Text>
                    </View>
                  </View>
                </View>

                <View style={tw`justify-center pl-2`}>
                   <ExternalLink color="#475569" size={20} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
