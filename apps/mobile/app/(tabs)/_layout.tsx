import { Tabs } from 'expo-router'
import { Home, Zap, Clock, Trophy, User, Grid } from 'lucide-react-native'

const GOLD = '#e2c97e'
const MUTED = '#4b5563'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0d0b26', borderTopColor: '#1e1b4b', height: 60 },
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: MUTED,
        tabBarLabelStyle: { fontSize: 10, marginBottom: 4 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Inicio', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tabs.Screen name="activities" options={{ title: 'Actividades', tabBarIcon: ({ color }) => <Zap size={22} color={color} /> }} />
      <Tabs.Screen name="cronos" options={{ title: 'Cronnos', tabBarIcon: ({ color }) => <Clock size={22} color={color} /> }} />
      <Tabs.Screen name="logros" options={{ title: 'Logros', tabBarIcon: ({ color }) => <Trophy size={22} color={color} /> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
      <Tabs.Screen name="secciones" options={{ title: 'Secciones', tabBarIcon: ({ color }) => <Grid size={22} color={color} /> }} />
    </Tabs>
  )
}
