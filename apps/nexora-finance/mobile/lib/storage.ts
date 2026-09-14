import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@nexora-finance/';

function key(name: string) {
  return `${PREFIX}${name}`;
}

export async function getStoredValue<T>(name: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key(name));
  if (raw === null) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setStoredValue<T>(name: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key(name), JSON.stringify(value));
}

export async function removeStoredValue(name: string): Promise<void> {
  await AsyncStorage.removeItem(key(name));
}
