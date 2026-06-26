import { Tabs } from 'expo-router'
import { Home, Zap, Calendar, Sword, User } from 'lucide-react-native'

const PURPLE = '#a855f7'
const MUTED = '#4b5563'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0d0b26', borderTopColor: '#1e1b4b', height: 60 },
        tabBarActiveTintColor: PURPLE,
        tabBarInactiveTintColor: MUTED,
        tabBarLabelStyle: { fontSize: 10, marginBottom: 4 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Inicio', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tabs.Screen name="activities" options={{ title: 'Actividades', tabBarIcon: ({ color }) => <Zap size={22} color={color} /> }} />
      <Tabs.Screen name="cronos" options={{ title: 'Cronos', tabBarIcon: ({ color }) => <Calendar size={22} color={color} /> }} />
      <Tabs.Screen name="odin" options={{ title: 'Odin', tabBarIcon: ({ color }) => <Sword size={22} color={color} /> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
      <Tabs.Screen name="logros" options={{ href: null }} />
      <Tabs.Screen name="secciones" options={{ href: null }} />
    </Tabs>
  )
}
