import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Returns a stable, cross-platform device fingerprint.
 * On iOS, uses Application.getIosIdForVendorAsync() combined with Device.modelId.
 * On Android, uses Application.getAndroidId() combined with Device.modelId.
 * Falls back to Constants.sessionId if others are unavailable.
 */
export const getDeviceId = async (): Promise<string> => {
  let uniqueId = 'unknown';

  if (Platform.OS === 'ios') {
    uniqueId = await Application.getIosIdForVendorAsync() || 'unknown-ios';
  } else if (Platform.OS === 'android') {
    uniqueId = Application.getAndroidId() || 'unknown-android';
  } else {
    uniqueId = Constants.sessionId || 'unknown-device';
  }

  const modelId = Device.modelId || Device.modelName || 'UnknownModel';
  return `${modelId}_${uniqueId}`;
};
