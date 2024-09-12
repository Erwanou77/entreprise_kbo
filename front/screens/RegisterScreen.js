import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import FetchService from '../utils/fetch';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false); // State to track loading status

  const handleRegister = async () => {
    if (name === '' || email === '' || password === '' || confirmPassword === '') {
      setErrorMessage('Champs vide');
    } else if (password !== confirmPassword) {
      setErrorMessage('Mot de passe invalide');
    } else {
      setLoading(true); // Start loading when registration begins
      try {
        const result = await FetchService.post('/api/auth/register', { name, email, password });
        console.log(result);

        if (result == null) {
          setErrorMessage('Enregistrement impossible, revenez plus tard');
        } else {
          setErrorMessage('');
          alert('Inscription réussie');
          navigation.navigate('Login');
        }
      } catch (error) {
        // console.error(error);
        setErrorMessage('Erreur de requête');
      } finally {
        setLoading(false); // Stop loading after the request is finished
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <>
          <TextInput
            style={styles.input}
            placeholder="Pseudo"
            value={name}
            onChangeText={setName}
            keyboardType="default"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
          <Button title="Inscription" onPress={handleRegister} />)}
        </>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default RegisterScreen;
