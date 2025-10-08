import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to auth screens by default
  return <Redirect href="/screens/auth" />;
}
