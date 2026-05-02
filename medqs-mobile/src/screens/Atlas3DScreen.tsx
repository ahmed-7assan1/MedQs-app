import React, { Suspense, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { useThemeStore } from '../store/useThemeStore';
import { ChevronLeft, Search, Layers, Info, RotateCw, ZoomIn, ZoomOut, Heart, Activity } from 'lucide-react-native';
import Animated, { FadeInRight, FadeInDown } from 'react-native-reanimated';
import { EliteButton } from '../components/ui/EliteButton';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei/native';

// ─── Human Model Component ──────────────────────────────────────────────────
function Model({ url, visible }: { url: string; visible: boolean }) {
  const { scene } = useGLTF(url);
  if (!visible) return null;
  return <primitive object={scene} scale={2} position={[0, -2, 0]} />;
}

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'skeletal', label: 'الهيكل العظمي', icon: Layers, color: '#F8FAFC', url: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/skeleton/model.gltf' },
  { id: 'muscular', label: 'الجهاز العضلي', icon: Activity, color: '#EF4444', url: '' },
  { id: 'circulatory', label: 'الجهاز الدوري', icon: Heart, color: '#F43F5E', url: '' },
];

export function Atlas3DScreen({ navigation }: any) {
  const { getTheme, primaryColor, isDarkMode } = useThemeStore();
  const theme = getTheme();
  const [search, setSearch] = useState('');
  const [activeLayers, setActiveLayers] = useState(['skeletal']);
  const [loading, setLoading] = useState(true);

  const toggleLayer = (id: string) => {
    if (activeLayers.includes(id)) {
      setActiveLayers(activeLayers.filter(l => l !== id));
    } else {
      setActiveLayers([...activeLayers, id]);
    }
  };

  return (
    <View style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* 3D Canvas Area */}
      <View style={tw`flex-1 bg-black`}>
        <Suspense fallback={
          <View style={tw`flex-1 items-center justify-center`}>
            <ActivityIndicator color={primaryColor} size="large" />
            <Text style={tw`text-white mt-4 font-bold`}>جاري تحميل النموذج التشريحي...</Text>
          </View>
        }>
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <color attach="background" args={['#07090F']} />
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
            <pointLight position={[-10, -10, -10]} />
            
            <Model 
              url={CATEGORIES[0].url} 
              visible={activeLayers.includes('skeletal')} 
            />
            
            <OrbitControls enablePan={false} />
            <Environment preset="city" />
            <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
          </Canvas>
        </Suspense>

        {/* 3D Floating Controls */}
        <View style={tw`absolute bottom-36 right-6 space-y-4`}>
          {[RotateCw, ZoomIn, ZoomOut].map((Icon, i) => (
            <TouchableOpacity 
              key={i}
              activeOpacity={0.7}
              style={[tw`p-4 rounded-2xl shadow-lg border`, { backgroundColor: theme.colors.surface + 'CC', borderColor: theme.colors.border }]}
            >
              <Icon color={theme.colors.text} size={20} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Header Overlay */}
      <View style={tw`absolute top-0 left-0 right-0`}>
        <SafeAreaView>
          <View style={tw`px-6 pt-4 flex-row items-center`}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[tw`p-3 rounded-2xl border mr-4 shadow-sm`, { backgroundColor: theme.colors.surface + 'CC', borderColor: theme.colors.border }]}
            >
              <ChevronLeft color={theme.colors.text} size={24} />
            </TouchableOpacity>
            
            <View style={[tw`flex-1 h-14 rounded-2xl px-5 flex-row items-center border shadow-sm`, { backgroundColor: theme.colors.surface + 'CC', borderColor: theme.colors.border }]}>
              <Search color={theme.colors.textMuted} size={20} style={tw`mr-3`} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="ابحث عن عضو أو عظمة..."
                placeholderTextColor={theme.colors.textMuted}
                style={[tw`flex-1 font-bold`, { color: theme.colors.text }]}
              />
            </View>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`px-6 py-4`}
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeLayers.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => toggleLayer(cat.id)}
                  activeOpacity={0.8}
                  style={[
                    tw`flex-row items-center px-5 py-3 rounded-2xl mr-3 border shadow-sm`,
                    { 
                      backgroundColor: isActive ? primaryColor : theme.colors.surface + 'CC',
                      borderColor: isActive ? primaryColor : theme.colors.border
                    }
                  ]}
                >
                  <cat.icon color={isActive ? 'white' : theme.colors.textMuted} size={16} style={tw`mr-2`} />
                  <Text style={[tw`font-bold text-xs`, { color: isActive ? 'white' : theme.colors.text }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* Bottom Info Sheet */}
      <Animated.View 
        entering={FadeInDown.delay(500)}
        style={[
          tw`absolute bottom-10 left-6 right-6 p-6 rounded-[28px] border shadow-2xl`,
          { backgroundColor: theme.colors.surface + 'EE', borderColor: theme.colors.border }
        ]}
      >
        <View style={tw`flex-row justify-between items-start mb-4`}>
          <View>
            <Text style={[tw`text-2xl font-black`, { color: theme.colors.text }]}>عظمة الفخذ (Femur)</Text>
            <Text style={[tw`text-xs font-bold uppercase tracking-widest`, { color: primaryColor }]}>الجهاز الهيكلي</Text>
          </View>
          <TouchableOpacity style={[tw`p-2 rounded-xl`, { backgroundColor: theme.colors.background }]}>
            <Info color={primaryColor} size={20} />
          </TouchableOpacity>
        </View>
        
        <Text style={[tw`text-sm leading-6 mb-6`, { color: theme.colors.textMuted }]}>
          تعتبر أطول وأقوى عظمة في جسم الإنسان. تصل بين الحوض والركبة وتلعب دوراً أساسياً في دعم وزن الجسم والحركة.
        </Text>

        <EliteButton 
          title="عرض التفاصيل الطبية الكاملة"
          onPress={() => {}}
          style={tw`h-12`}
        />
      </Animated.View>
    </View>
  );
}
