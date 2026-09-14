import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#020617',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#1e293b',
        },
        headerTintColor: '#ffffff',
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', headerTitle: 'Nexora Operating Core' }} />
      <Tabs.Screen name="pos" options={{ title: 'POS Kasir', headerTitle: 'Nexora Smart POS' }} />
      <Tabs.Screen name="finance" options={{ title: 'Finance', headerTitle: 'AI Financial Ledger' }} />
      <Tabs.Screen name="inventory" options={{ title: 'Inventory', headerTitle: 'Multi-Warehouse Inventory' }} />
      <Tabs.Screen name="growth" options={{ title: 'Growth & Ads', headerTitle: 'AI Marketing & Growth Copilot' }} />
    </Tabs>
  );
}
