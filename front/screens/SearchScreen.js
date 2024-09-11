// screens/SearchScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const sampleData = [
  'Produit A',
  'Produit B',
  'Produit C',
  'Produit D',
  'Produit E',
  'Produit F',
];

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  const handleSearch = async () => {
    if (query!='') {
    const results = sampleData.filter(item =>
      item.toLowerCase().includes(query.toLowerCase())
    );
    try {
        const existingHistory = await AsyncStorage.getItem('searchHistory');
        let searchHistory = existingHistory ? JSON.parse(existingHistory) : [];
        // Add the new search query at the start
        searchHistory.unshift(query);
        console.log(searchHistory);
        
        // Keep only the latest 10 searches
        searchHistory = searchHistory.slice(0, 10);
        await AsyncStorage.setItem('searchHistory', JSON.stringify(searchHistory));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de l’historique', error);
      }
    setFilteredData(results);
    }
  };
  const handleProductPress = (enterpriseName) => {
    navigation.navigate('Enterprise', { enterpriseName });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher..."
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleProductPress(item)}
          >
            <Text style={styles.itemText}>{item}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchButton: {
    backgroundColor: '#42a5f5',
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  list: {
    flexGrow: 1,
  },
  item: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
  },
  itemText: {
    fontSize: 16,
  },
});

export default SearchScreen;
