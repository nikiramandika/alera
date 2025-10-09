import { Redirect } from 'expo-router';

export default function AuthIndex() {
  // Redirect to welcome screen by default
  return <Redirect href="/screens/auth/WelcomeScreen" />;
}