// screens/EnterpriseScreen.js
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const EnterpriseScreen = ({ route, navigation }) => {
  // Retrieve enterpriseName from route params
  const { enterpriseName } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Détails de l'Entreprise</Text>
      <Text style={styles.enterpriseName}>{enterpriseName}</Text>
      <Button
        title="Retour"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  enterpriseName: {
    fontSize: 18,
    marginBottom: 30,
    color: '#333',
  },
});

export default EnterpriseScreen;
