import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_PROPERTY_KEY = 'hs_active_property';

export const tenant = {
  async getActivePropertyId(): Promise<string> {
    const stored = await AsyncStorage.getItem(ACTIVE_PROPERTY_KEY);
    const envDefault = process.env.EXPO_PUBLIC_DEFAULT_PROPERTY_ID || 'demo_property_h1';
    const propertyId = stored || envDefault;
    if (!propertyId) throw new Error('No active property configured');
    return propertyId;
  }
};
