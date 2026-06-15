import { Redirect } from 'expo-router'

// Entry point — redirige según sesión activa
// TODO: verificar token en SecureStore y redirigir a (auth)/login o (tabs)/home
export default function Index() {
  return <Redirect href="/(auth)/login" />
}
