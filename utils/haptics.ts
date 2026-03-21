import * as Haptics from 'expo-haptics';

export const hapticSuccess = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
export const hapticWarning = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
export const hapticSelection = () => Haptics.selectionAsync();
export const hapticImpact = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
