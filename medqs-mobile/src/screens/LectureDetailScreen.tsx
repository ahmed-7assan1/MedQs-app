import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, SafeAreaView, 
  Image, Dimensions, StatusBar, ActivityIndicator,
  Platform
} from 'react-native';
import tw from 'twrnc';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { 
  ChevronLeft, Play, FileText, 
  Download, Clock, User, 
  Share2, CheckCircle2, Sparkles,
  BookOpen, Layers, MessageSquare,
  ArrowRight, Bookmark
} from 'lucide-react-native';
import { useThemeStore } from '../store/useThemeStore';
import { mobileApi } from '../lib/api';
import * as Haptics from 'expo-haptics';
import { Video, ResizeMode } from 'expo-av';

const { width } = Dimensions.get('window');

export function LectureDetailScreen({ route, navigation }: any) {
  const { lectureId, lectureTitle, subjectTitle } = route.params || {};
  const { primaryColor, primaryLight } = useThemeStore();
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [lecture, setLecture] = useState<any>(null);

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      setLecture({
        id: lectureId,
        title: lectureTitle || 'Human Heart Anatomy',
        subject: subjectTitle || 'Cardiology',
        instructor: 'Dr. Sarah Wilson',
        duration: '45 mins',
        description: 'Detailed study of the cardiac chambers, valves, and electrical conduction system. This lecture is essential for understanding hemodynamic principles.',
        outcomes: [
          'Identify all four cardiac chambers',
          'Explain the conduction pathway (SA to Purkinje)',
          'Describe the valvular mechanism',
          'Understand blood flow through the heart'
        ],
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-doctor-checking-a-patients-heart-with-a-stethoscope-40332-large.mp4',
        resources: [
          { id: '1', title: 'Full Lecture PDF', type: 'pdf', size: '4.2 MB' },
          { id: '2', title: 'Anatomy Atlas Ref', type: 'image', size: '12 MB' }
        ]
      });
      setLoading(false);
    }, 800);
  }, [lectureId]);

  if (loading) {
    return (
      <View style={tw`flex-1 bg-black items-center justify-center`}>
         <ActivityIndicator color={primaryColor} size="large" />
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-black`}>
      <StatusBar barStyle="light-content" />
      
      {/* Video Player Section */}
      <View style={[tw`bg-[#0D1117] relative`, { height: width * 0.6 }]}>
         <Video
            source={{ uri: lecture.videoUrl }}
            style={tw`absolute inset-0`}
            resizeMode={ResizeMode.COVER}
            useNativeControls
            shouldPlay={false}
         />
         
         <TouchableOpacity 
           onPress={() => navigation.goBack()}
           style={tw`absolute top-12 left-6 p-2 bg-black/40 rounded-xl border border-white/10 backdrop-blur-md`}
         >
            <ChevronLeft color="white" size={24} />
         </TouchableOpacity>

         <TouchableOpacity 
           style={tw`absolute top-12 right-6 p-2 bg-black/40 rounded-xl border border-white/10 backdrop-blur-md`}
         >
            <Bookmark color="white" size={24} />
         </TouchableOpacity>
      </View>

      <View style={tw`flex-1 px-6 pt-6`}>
         <View style={tw`flex-row justify-between items-start mb-4`}>
            <View style={tw`flex-1`}>
               <View style={tw`bg-teal-500/10 self-start px-3 py-1 rounded-full mb-2`}>
                  <Text style={tw`text-teal-400 text-[10px] font-black uppercase tracking-widest`}>{lecture.subject}</Text>
               </View>
               <Text style={tw`text-2xl font-black text-white`}>{lecture.title}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              style={tw`p-3 bg-[#0D1117] border border-[#1E2D4D] rounded-2xl ml-4`}
            >
               <Share2 color="white" size={20} />
            </TouchableOpacity>
         </View>

         <View style={tw`flex-row items-center mb-8`}>
            <View style={tw`flex-row items-center mr-6 bg-[#0D1117] px-3 py-1.5 rounded-full border border-[#1E2D4D]`}>
               <Clock color={primaryLight} size={14} style={tw`mr-2`} />
               <Text style={tw`text-slate-400 text-xs font-black uppercase`}>{lecture.duration}</Text>
            </View>
            <View style={tw`flex-row items-center bg-[#0D1117] px-3 py-1.5 rounded-full border border-[#1E2D4D]`}>
               <User color={primaryLight} size={14} style={tw`mr-2`} />
               <Text style={tw`text-slate-400 text-xs font-black uppercase`}>{lecture.instructor}</Text>
            </View>
         </View>

         {/* Tabs */}
         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`flex-grow-0 mb-6`}>
            {['Overview', 'AI Notes', 'Resources', 'Discussions'].map((tab) => (
              <TouchableOpacity 
                key={tab}
                onPress={() => { setActiveTab(tab); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[
                  tw`mr-4 px-6 py-3 rounded-2xl border`,
                  activeTab === tab ? { backgroundColor: primaryColor, borderColor: primaryColor } : tw`bg-transparent border-white/10`
                ]}
              >
                <Text style={[tw`font-black text-sm`, activeTab === tab ? tw`text-white` : tw`text-slate-500`]}>{tab}</Text>
              </TouchableOpacity>
            ))}
         </ScrollView>

         <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-32`}>
            {activeTab === 'Overview' && (
              <Animated.View entering={FadeInDown}>
                 <Text style={tw`text-slate-400 leading-7 text-[15px] mb-8`}>
                    {lecture.description}
                 </Text>
                 
                 <Text style={tw`text-white font-black text-lg mb-4`}>Learning Objectives</Text>
                 {lecture.outcomes.map((item: string, i: number) => (
                   <View key={i} style={tw`flex-row items-center mb-4 bg-white/2 p-4 rounded-2xl border border-white/5`}>
                      <View style={[tw`w-8 h-8 rounded-full items-center justify-center mr-4`, { backgroundColor: primaryColor + '20' }]}>
                         <CheckCircle2 color={primaryColor} size={16} />
                      </View>
                      <Text style={tw`text-slate-300 font-bold flex-1`}>{item}</Text>
                   </View>
                 ))}

                 <TouchableOpacity style={[tw`mt-6 py-5 rounded-[32px] items-center flex-row justify-center`, { backgroundColor: primaryColor }]}>
                    <Text style={tw`text-white font-black text-lg mr-2`}>Start Smart Quiz</Text>
                    <ArrowRight color="white" size={20} strokeWidth={3} />
                 </TouchableOpacity>
              </Animated.View>
            )}

            {activeTab === 'AI Notes' && (
              <Animated.View entering={FadeInDown} style={tw`bg-[#0D1117] p-6 rounded-[32px] border border-[#1E2D4D]`}>
                 <View style={tw`flex-row items-center mb-4`}>
                    <View style={tw`w-10 h-10 bg-indigo-500/10 rounded-xl items-center justify-center mr-3 border border-indigo-500/20`}>
                       <Sparkles color="#818cf8" size={20} />
                    </View>
                    <Text style={tw`text-white font-black text-lg`}>AI Intelligence Summary</Text>
                 </View>
                 <Text style={tw`text-slate-400 leading-7 text-[15px] italic mb-4`}>
                    Generated based on video transcript and key medical terminologies found in this session.
                 </Text>
                 <View style={tw`h-px bg-white/5 mb-6`} />
                 <Text style={tw`text-slate-300 leading-8`}>
                    • The heart is a dual-pump system.\n
                    • SA node acts as the primary pacemaker (60-100 bpm).\n
                    • AV node provides crucial delay for ventricular filling.\n
                    • Valvular integrity is key for unidirectional flow.
                 </Text>
              </Animated.View>
            )}

            {activeTab === 'Resources' && (
              <Animated.View entering={FadeInDown}>
                 {lecture.resources.map((res: any) => (
                   <TouchableOpacity key={res.id} style={tw`bg-[#0D1117] p-5 rounded-[32px] border border-[#1E2D4D] flex-row items-center mb-3`}>
                      <View style={tw`w-14 h-14 bg-white/5 rounded-2xl items-center justify-center mr-4 border border-white/5`}>
                         <FileText color={primaryColor} size={28} />
                      </View>
                      <View style={tw`flex-1`}>
                         <Text style={tw`text-white font-black text-base`}>{res.title}</Text>
                         <Text style={tw`text-slate-500 text-xs font-bold`}>{res.type.toUpperCase()} • {res.size}</Text>
                      </View>
                      <View style={tw`bg-white/5 p-3 rounded-xl border border-white/5`}>
                         <Download color="white" size={20} />
                      </View>
                   </TouchableOpacity>
                 ))}
              </Animated.View>
            )}
         </ScrollView>
      </View>
    </View>
  );
}
