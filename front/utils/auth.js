import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (user) => {
  try {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  } catch (e) {
    console.log('Failed to save user login', e);
  }
};

export const isLoggedIn = async () => {
  try {
    const user = await AsyncStorage.getItem('user');
    return user !== null;
  } catch (e) {
    console.log('Failed to check login status', e);
    return false;
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem('user');
  } catch (e) {
    console.log('Failed to logout', e);
  }
};
