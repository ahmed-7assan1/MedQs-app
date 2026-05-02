import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, FlatList, ActivityIndicator, StatusBar, Alert, Modal } from 'react-native';
import tw from 'twrnc';
import { useThemeStore } from '../store/useThemeStore';
import { ChevronLeft, Search, BookOpen, Layers, ArrowRightLeft, Copy, X, Database, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { mobileApi } from '../lib/api';
import Animated, { FadeInRight, FadeInDown } from 'react-native-reanimated';
import { EliteButton } from '../components/ui/EliteButton';

export function AdminQuizManagerScreen({ navigation }: any) {
  const { getTheme, primaryColor, isDarkMode } = useThemeStore();
  const theme = getTheme();
  
  const [papers, setPapers] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferMode, setTransferMode] = useState<'move' | 'copy'>('move');
  const [targetSemester, setTargetSemester] = useState<string>('');

  const fetchData = async () => {
    try {
      const [pp, sem] = await Promise.all([
        mobileApi.getPastPapers({ semesterId: '', kind: 'ADMIN_AUTHORED_QUIZ' }), // Fetch all admin quizzes
        mobileApi.getSemesters(''), // Fetch all semesters (might need adjustment)
      ]);
      setPapers(pp || []);
      setSemesters(sem || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPapers = papers.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleTransfer = async () => {
    if (!targetSemester) return Alert.alert('خطأ', 'يرجى اختيار الفصل الدراسي المستهدف');
    setLoading(true);
    try {
      // Assuming a method like transferQuiz exists or using existing post/put
      await mobileApi.transferQuiz({
        paperId: selectedPaper.id,
        targetSemesterId: targetSemester,
        mode: transferMode
      });
      Alert.alert('نجاح', `تم ${transferMode === 'move' ? 'نقل' : 'نسخ'} الاختبار بنجاح`);
      setShowTransfer(false);
      fetchData();
    } catch (err) {
      Alert.alert('خطأ', 'فشل في عملية النقل');
    } finally {
      setLoading(false);
    }
  };

  const PaperItem = ({ item }: { item: any }) => (
    <Animated.View 
      entering={FadeInRight}
      style={[tw`p-5 rounded-[28px] mb-4 border shadow-sm`, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <View style={tw`flex-1 mr-4`}>
          <Text style={[tw`font-bold text-lg`, { color: theme.colors.text }]}>{item.title}</Text>
          <View style={tw`flex-row items-center mt-1`}>
            <Layers color={theme.colors.textMuted} size={12} style={tw`mr-1`} />
            <Text style={[tw`text-[10px] font-bold`, { color: theme.colors.textMuted }]}>
              {item.semester?.name || 'فصل غير محدد'}
            </Text>
          </View>
        </View>
        <View style={[tw`w-12 h-12 rounded-2xl items-center justify-center`, { backgroundColor: primaryColor + '10' }]}>
          <BookOpen color={primaryColor} size={24} />
        </View>
      </View>

      <View style={tw`flex-row justify-between items-center pt-4 border-t border-dashed border-slate-700/20`}>
        <View style={tw`flex-row items-center`}>
          <Database color={theme.colors.textMuted} size={14} style={tw`mr-1.5`} />
          <Text style={[tw`text-[10px] font-bold`, { color: theme.colors.textMuted }]}>
            {item._count?.attempts || 0} محاولة
          </Text>
        </View>
        <View style={tw`flex-row gap-2`}>
          <TouchableOpacity 
            onPress={() => { setSelectedPaper(item); setTransferMode('move'); setShowTransfer(true); }}
            style={[tw`p-2.5 rounded-xl border`, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
          >
            <ArrowRightLeft color={primaryColor} size={18} />
          </TouchableOpacity>
          <TouchableOpacity 
             onPress={() => { setSelectedPaper(item); setTransferMode('copy'); setShowTransfer(true); }}
            style={[tw`p-2.5 rounded-xl border`, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
          >
            <Copy color={primaryColor} size={18} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={tw`px-6 pt-4 pb-4`}>
        <View style={tw`flex-row items-center mb-6`}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={[tw`p-3 rounded-2xl border`, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <ChevronLeft color={theme.colors.text} size={24} />
          </TouchableOpacity>
          <View style={tw`ml-4`}>
            <Text style={[tw`font-black text-2xl`, { color: theme.colors.text }]}>مركز الاختبارات</Text>
            <Text style={[tw`text-xs font-bold uppercase tracking-widest`, { color: theme.colors.textMuted }]}>
              إدارة ونقل الاختبارات بين الفصول
            </Text>
          </View>
        </View>

        <View style={[tw`h-14 rounded-2xl px-5 flex-row items-center border shadow-sm`, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Search color={theme.colors.textMuted} size={20} style={tw`mr-3`} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="البحث في الاختبارات..."
            placeholderTextColor={theme.colors.textMuted}
            style={[tw`flex-1 font-bold`, { color: theme.colors.text }]}
          />
        </View>
      </View>

      {loading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator color={primaryColor} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredPapers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PaperItem item={item} />}
          contentContainerStyle={tw`px-6 pb-32 pt-2`}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchData}
          refreshing={refreshing}
        />
      )}

      {/* Transfer Modal */}
      <Modal visible={showTransfer} transparent animationType="slide">
        <View style={tw`flex-1 bg-black/60 items-center justify-end`}>
          <Animated.View entering={FadeInDown} style={[tw`w-full p-8 rounded-t-[40px]`, { backgroundColor: theme.colors.surface }]}>
            <View style={tw`flex-row justify-between items-center mb-6`}>
              <View>
                <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: primaryColor }]}>
                  {transferMode === 'move' ? 'نقل الاختبار' : 'نسخ الاختبار'}
                </Text>
                <Text style={[tw`text-xl font-black`, { color: theme.colors.text }]}>{selectedPaper?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTransfer(false)} style={tw`p-2`}>
                <X color={theme.colors.textMuted} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={[tw`text-xs font-bold mb-4`, { color: theme.colors.textMuted }]}>اختر الفصل الدراسي المستهدف:</Text>
            
            <ScrollView style={tw`max-h-60 mb-6`}>
              {semesters.map(s => (
                <TouchableOpacity 
                  key={s.id}
                  onPress={() => setTargetSemester(s.id)}
                  style={[
                    tw`flex-row items-center justify-between p-4 rounded-2xl mb-2 border`,
                    { 
                      backgroundColor: targetSemester === s.id ? primaryColor + '10' : theme.colors.background,
                      borderColor: targetSemester === s.id ? primaryColor : theme.colors.border
                    }
                  ]}
                >
                  <Text style={[tw`font-bold`, { color: targetSemester === s.id ? primaryColor : theme.colors.text }]}>{s.name}</Text>
                  {targetSemester === s.id && <CheckCircle2 color={primaryColor} size={20} />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <EliteButton 
              title={transferMode === 'move' ? "تأكيد النقل" : "تأكيد النسخ"}
              onPress={handleTransfer}
              loading={loading}
            />
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
