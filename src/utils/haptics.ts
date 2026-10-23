import * as Haptics from 'expo-haptics';

// Fire-and-forget wrappers; haptics must never break a flow.
export const tapHaptic = () => {
  Haptics.selectionAsync().catch(() => {});
};

export const successHaptic = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {},
  );
};

export const warningHaptic = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
    () => {},
  );
};
