import { StyleSheet, Text, View } from 'react-native';

export default function ChatsScreen() {
  return <View style={styles.container}><Text style={styles.title}>Chats</Text><Text>Conversations will appear here after a match.</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  title: { fontSize: 32, fontWeight: '800' }
});