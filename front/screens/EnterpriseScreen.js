// screens/EnterpriseScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FetchService from '../utils/fetch';

const EnterpriseScreen = ({ route }) => {
  const [data, setData] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false); // To track if the enterprise is already a favorite

  // Retrieve enterprise object from route params
  const { enterprise } = route.params;

  // Fetch company details
  const fetchDetails = async () => {
    const resultat = await FetchService.get("/api/company/details?entity_number=" + enterprise["entity_number"]);
    if (resultat != null) {
      setData(resultat);
    }
  };

  // Check if the enterprise is in favorites
  const checkIfFavorite = async () => {
    try {
      const favorites = await AsyncStorage.getItem('favoris');
      if (favorites !== null) {
        const parsedFavorites = JSON.parse(favorites);
        // Check if this enterprise is already in the list
        const alreadyFavorite = parsedFavorites.some(item => item.entity_number === enterprise.entity_number);
        setIsFavorite(alreadyFavorite);
      }
    } catch (error) {
      console.log("Error reading favorites from AsyncStorage", error);
    }
  };

  // Add enterprise to favorites
  const addToFavorites = async () => {
    try {
      const favorites = await AsyncStorage.getItem('favoris');
      let parsedFavorites = favorites ? JSON.parse(favorites) : [];

      // Check if the enterprise is already in favorites
      if (!parsedFavorites.some(item => item.entity_number === enterprise.entity_number)) {
        parsedFavorites.push(enterprise);
        await AsyncStorage.setItem('favoris', JSON.stringify(parsedFavorites));
        setIsFavorite(true); // Update state
      }
    } catch (error) {
      console.log("Error saving to AsyncStorage", error);
    }
  };

  useEffect(() => {
    fetchDetails();
    checkIfFavorite();
  }, []);

  // Extracting the enterprise name (handling multiple denominations)
  const name = enterprise.denominations
    ? (enterprise.denominations[1]
      ? enterprise.denominations[1].denomination
      : enterprise.denominations[0].denomination)
    : "aucun nom";

  return (
    <ScrollView style={styles.container}>
      {/* Button to add to favorites */}
      <View style={styles.row}>
        {isFavorite ? (
          <Text style={styles.favoriteText}>Déjà dans les favoris</Text>
        ) : (
          <Button title="Ajouter aux favoris" onPress={addToFavorites} />
        )}
      </View>
      <Text style={styles.title}>Détails de l'Entreprise</Text>

      {/* Nom */}
      <View style={styles.row}>
        <Text style={styles.label}>Nom: </Text>
        <Text style={styles.value}>{name}</Text>
      </View>

      {/* Numéro d'entreprise */}
      <View style={styles.row}>
        <Text style={styles.label}>Numéro d'entreprise: </Text>
        <Text style={styles.value}>{enterprise["entity_number"]}</Text>
      </View>

      

      {/* Statut */}
      <View style={styles.row}>
        <Text style={styles.label}>Statut: </Text>
        <Text style={styles.value}>{enterprise["status"]}</Text>
      </View>

      {/* Situation juridique */}
      <View style={styles.row}>
        <Text style={styles.label}>Situation juridique: </Text>
        <Text style={styles.value}>{enterprise["juridical_situation"]}</Text>
      </View>

      {/* Forme juridique */}
      <View style={styles.row}>
        <Text style={styles.label}>Forme juridique: </Text>
        <Text style={styles.value}>{enterprise["juridical_form"]}</Text>
      </View>
      
      {/* Date de création */}
      <View style={styles.row}>
        <Text style={styles.label}>Date de création: </Text>
        <Text style={styles.value}>{enterprise["start_date"]}</Text>
      </View>

      {/* Activités */}
      {enterprise.activities.length > 0 ? (
        <Text style={styles.title}>Activités</Text>
      ) : null}

      {
        enterprise.activities.map((element, index) => (
          <View key={"act1" + index} style={styles.row}>
            <Text style={styles.label}>{element["activity_group"]}: </Text>
            <Text style={styles.value}>{element["nace_description"]}</Text>
          </View>
        ))
      }

      {/* Addresses */}
      <Text style={styles.title}>Adresses</Text>
      {
        enterprise.addresses.map((element, index) => (
          <View key={"ddr" + index} style={styles.row}>
            <Text style={styles.label}>{element["type_of_address"]}: </Text>
            <Text style={styles.value}>
              {element["house_number"]} rue {element.street} {element.municipality} {element.zipcode}
            </Text>
          </View>
        ))
      }

      {/* Établissements */}
      {enterprise.establishments.length > 0 ? (
        <Text style={styles.title}>Etablissements</Text>
      ) : null}

      {
        enterprise.establishments.map((element, index) => (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Nom: </Text>
              <Text style={styles.value}>{element.denominations.length>0? (element.denominations.length>1? (element.denominations[1].denomination? element.denominations[1].denomination:(element.denominations[0].denomination?element.denominations[0].denomination:"aucun nom"))
                  : (element.denominations[0].denomination?element.denominations[0].denomination:"aucun nom"))
                : "aucun nom"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Numéro d'entreprise: </Text>
              <Text style={styles.value}>{element["entity_number"]}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Date de création: </Text>
              <Text style={styles.value}>{element["start_date"]}</Text>
            </View>
            {/* ... (rest of the code) */}
          </>
        ))
      }
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#42a5f5',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow text to wrap
    marginBottom: 15,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  value: {
    fontSize: 18,
    color: '#555',
    flex: 1, // Allow the value to take up the remaining space
    flexWrap: 'wrap', // Allow value text to wrap if too long
  },
  favoriteText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'green',
  }
});

export default EnterpriseScreen;
