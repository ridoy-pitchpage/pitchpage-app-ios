import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "pitchpage.onboarding.complete.v1";

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) === "true";
  } catch {
    return false;
  }
}

export async function completeOnboarding(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, "true");
}
