import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Linking } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { mobileApi } from '../lib/api';
import { ChevronLeft, PlayCircle, FileText, Clock, ExternalLink } from 'lucide-react-native';

export function SubjectDetailScreen({ route, navigation }: any) {
  const { subjectId, subjectTitle, subjectColor } = route.params;
  const { getTheme, primaryColor, primaryLight } = useThemeStore();
  const theme = getTheme();
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<any>(null);

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const data = await mobileApi.getSubject(subjectId);
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
    if (url) Linking.openURL(url).catch(() => {});
  };

  const accentColor = subjectColor || primaryColor;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border }}>
          <ChevronLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center', paddingHorizontal: 12 }} numberOfLines={1}>
          {subjectTitle}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={primaryLight} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: accentColor + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: accentColor + '30' }}>
            <FileText color={accentColor} size={32} />
          </View>
          <Text style={{ color: theme.colors.text, fontSize: 26, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 }}>{subject?.title || subjectTitle}</Text>
          <Text style={{ color: theme.colors.textMuted, fontWeight: '600', fontSize: 14, marginBottom: 32 }}>{subject?.module?.name}</Text>

          <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900', marginBottom: 16 }}>Lectures ({subject?.lectures?.length || 0})</Text>

          {(!subject?.lectures || subject.lectures.length === 0) ? (
            <View style={{ paddingVertical: 40, alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 24, borderWidth: 1, borderColor: theme.colors.border }}>
              <Text style={{ color: theme.colors.textMuted, fontWeight: '600' }}>No lectures available yet.</Text>
            </View>
          ) : (
            subject.lectures.map((lecture: any) => (
              <TouchableOpacity
                key={lecture.id}
                style={{ flexDirection: 'row', padding: 16, marginBottom: 16, backgroundColor: theme.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border }}
                activeOpacity={0.7}
                onPress={() => {
                  navigation.navigate('LectureDetail', {
                    lectureId: lecture.id,
                    lectureTitle: lecture.title,
                    subjectTitle: subject.title
                  });
                }}
              >
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: lecture.type === 'VIDEO' ? '#ef444420' : '#22c55e20', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                  {lecture.type === 'VIDEO' ? <PlayCircle color="#f87171" size={24} /> : <FileText color="#4ade80" size={24} />}
                </View>

                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14, marginBottom: 4 }}>{lecture.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {lecture.duration && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                        <Clock color={theme.colors.textMuted} size={12} style={{ marginRight: 4 }} />
                        <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '500' }}>{lecture.duration} mins</Text>
                      </View>
                    )}
                    <View style={{ backgroundColor: theme.colors.surfaceLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border }}>
                      <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>{lecture.type}</Text>
                    </View>
                  </View>
                </View>

                <View style={{ justifyContent: 'center', paddingLeft: 8 }}>
                  <ExternalLink color={theme.colors.textMuted} size={18} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}