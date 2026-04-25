import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Image, Dimensions } from 'react-native';
import tw from 'twrnc';
import { EliteTheme } from '../constants/Theme';
import { EliteCard } from '../components/ui/EliteCard';
import { 
  ChevronLeft, Play, FileText, 
  Download, Clock, User, 
  Share2, CheckCircle2
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export function LectureDetailScreen({ route, navigation }: any) {
  const { lectureId, lectureTitle, subjectTitle } = route.params;
  const [activeTab, setActiveTab] = useState('video');

  return (
    <SafeAreaView style={tw`flex-1 bg-[${EliteTheme.colors.background}]`}>
      {/* Video Placeholder Section */}
      <View style={[tw`bg-black justify-center items-center`, { height: width * 0.56 }]}>
         <Image 
           source={{ uri: 'https://images.unsplash.com/photo-1576091160550-2173dad99901?q=80&w=1000' }} 
           style={[tw`absolute opacity-50`, { width: '100%', height: '100%' }]} 
         />
         <TouchableOpacity style={tw`w-16 h-16 bg-[${EliteTheme.colors.primary}]/80 rounded-full items-center justify-center shadow-lg shadow-[${EliteTheme.colors.primaryDark}] border border-white/20`}>
            <Play color="white" size={32} fill="white" style={tw`ml-1`} />
         </TouchableOpacity>
         
         <TouchableOpacity 
           onPress={() => navigation.goBack()}
           style={tw`absolute top-4 left-6 p-2 bg-black/40 rounded-full border border-white/10`}
         >
            <ChevronLeft color="white" size={24} />
         </TouchableOpacity>
      </View>

      <View style={tw`p-6`}>
         <View style={tw`flex-row justify-between items-start mb-4`}>
            <View style={tw`flex-1`}>
               <Text style={tw`text-[${EliteTheme.colors.primaryLight}] text-xs font-bold uppercase tracking-widest`}>{subjectTitle}</Text>
               <Text style={tw`text-2xl font-bold text-white mt-1`}>{lectureTitle}</Text>
            </View>
            <TouchableOpacity style={tw`p-2 bg-white/5 rounded-full border border-white/10`}>
               <Share2 color="white" size={20} />
            </TouchableOpacity>
         </View>

         <View style={tw`flex-row items-center mb-8`}>
            <View style={tw`flex-row items-center mr-6`}>
               <Clock color="#94a3b8" size={14} style={tw`mr-1`} />
               <Text style={tw`text-slate-400 text-xs font-medium`}>45 Minutes</Text>
            </View>
            <View style={tw`flex-row items-center`}>
               <User color="#94a3b8" size={14} style={tw`mr-1`} />
               <Text style={tw`text-slate-400 text-xs font-medium`}>Dr. Ahmed Hassan</Text>
            </View>
         </View>

         {/* Tabs */}
         <View style={tw`flex-row border-b border-white/10 mb-6`}>
            {['Video', 'Notes', 'Resources'].map((tab) => (
              <TouchableOpacity 
                key={tab}
                onPress={() => setActiveTab(tab.toLowerCase())}
                style={[
                  tw`mr-8 pb-3`,
                  activeTab === tab.toLowerCase() ? tw`border-b-2 border-[${EliteTheme.colors.primaryLight}]` : {}
                ]}
              >
                <Text style={[tw`font-bold`, activeTab === tab.toLowerCase() ? tw`text-[${EliteTheme.colors.primaryLight}]` : tw`text-slate-500`]}>{tab}</Text>
              </TouchableOpacity>
            ))}
         </View>

         <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-40`}>
            {activeTab === 'video' && (
               <View>
                  <Text style={tw`text-slate-300 leading-6 mb-6`}>
                    This lecture covers the fundamental principles of immunology, focusing on the primary and secondary lymphoid organs, cell-mediated immunity, and the role of B and T cells.
                  </Text>
                  
                  <Text style={tw`text-white font-bold mb-4`}>What you'll learn:</Text>
                  {[
                    'Structure of the Thymus',
                    'Bone Marrow functions',
                    'Lymphocyte maturation process',
                    'Antigen recognition basics'
                  ].map((item, i) => (
                    <View key={i} style={tw`flex-row items-center mb-3`}>
                       <CheckCircle2 color={EliteTheme.colors.success} size={16} style={tw`mr-3`} />
                       <Text style={tw`text-slate-300 font-medium`}>{item}</Text>
                    </View>
                  ))}
               </View>
            )}

            {activeTab === 'notes' && (
               <View style={tw`bg-slate-800 p-5 rounded-3xl border border-white/10`}>
                  <View style={tw`flex-row items-center mb-4`}>
                     <FileText color={EliteTheme.colors.primaryLight} size={20} style={tw`mr-2`} />
                     <Text style={tw`text-white font-bold`}>Lecture Summary</Text>
                  </View>
                  <Text style={tw`text-slate-400 leading-6 italic`}>
                    Note: These summaries are generated by AI based on the lecture video. Please refer to your textbooks for official study material.
                  </Text>
                  <Text style={tw`text-slate-300 mt-4 leading-7`}>
                    • Immunology is the study of the immune system.\n
                    • Innate immunity provides immediate protection.\n
                    • Adaptive immunity is highly specific and has memory.
                  </Text>
               </View>
            )}

            {activeTab === 'resources' && (
               <View>
                  <EliteCard variant="glass" style={tw`flex-row items-center p-4 mb-3`}>
                     <View style={tw`w-10 h-10 bg-red-500/20 rounded-xl items-center justify-center mr-4 border border-red-500/30`}>
                        <FileText color="#f87171" size={20} />
                     </View>
                     <Text style={tw`flex-1 text-white font-bold`}>Lecture Slides (PDF)</Text>
                     <TouchableOpacity style={tw`p-2 bg-white/5 rounded-full border border-white/10`}>
                       <Download color="#cbd5e1" size={16} />
                     </TouchableOpacity>
                  </EliteCard>
                  <EliteCard variant="glass" style={tw`flex-row items-center p-4`}>
                     <View style={tw`w-10 h-10 bg-[${EliteTheme.colors.primary}]/20 rounded-xl items-center justify-center mr-4 border border-[${EliteTheme.colors.primary}]/30`}>
                        <FileText color={EliteTheme.colors.primaryLight} size={20} />
                     </View>
                     <Text style={tw`flex-1 text-white font-bold`}>Sample Questions</Text>
                     <TouchableOpacity style={tw`p-2 bg-white/5 rounded-full border border-white/10`}>
                       <Download color="#cbd5e1" size={16} />
                     </TouchableOpacity>
                  </EliteCard>
               </View>
            )}
         </ScrollView>
      </View>
    </SafeAreaView>
  );
}
