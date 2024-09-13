import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dropdown } from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';
import FetchService from '../utils/fetch';

const Type = [
  { label: 'Numero Etab', value: '1' },
  { label: 'Nom Societé', value: '2' },
  { label: 'Activité', value: '3' },
  { label: 'Adresse', value: '4' }
];

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]); // Ensure it's an array
  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);
  const [page, setPage] = useState(1); // New state for current page
  const [isLoading, setIsLoading] = useState(false); // New state for loading
  const [hasMore, setHasMore] = useState(true); // New state to check if more data is available

  const renderLabel = () => {
    if (value || isFocus) {
      return (
        <Text style={[styles.label, isFocus && { color: 'blue' }]}>
          Rechercher par type
        </Text>
      );
    }
    return null;
  };

  const handleSearch = async (page = 1) => {
    if (query !== '' && value !== null) {
      setIsLoading(true);
      try {
        const resultat = await FetchService.get(`/api/company/search?searchQuery=${query}&searchField=${value}&page=${page}&limit=20`);
        
        // Extract data array from result
        const data = resultat.data || [];
        setFilteredData(prevData => page === 1 ? data : [...prevData, ...data]);
        setPage(page);
        setHasMore(data.length > 0); // Check if more data is available
        
        // Save search history
        const existingHistory = await AsyncStorage.getItem('searchHistory');
        let searchHistory = existingHistory ? JSON.parse(existingHistory) : [];
        searchHistory.unshift([query, Type[value - 1].label]);
        searchHistory = searchHistory.slice(0, 10);
        await AsyncStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        
      } catch (error) {
        console.error('Erreur lors de la recherche', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleProductPress = (item) => {
    // console.log(item);
    
    navigation.navigate('Enterprise', { enterprise: item });
  };

  const renderItem = ({ item }) => {
    // Customize the item display based on your needs
    const addr = item.addresses.filter((element) => element["type_of_address"] == "Siège")[0];
    const enterpriseName = item.denominations ? (item.denominations[1] ? item.denominations[1].denomination : item.denominations[0].denomination) : item["entity_number"];
    const activity = item.activities.length > 0 ? item.activities[0]["nace_description"] + (item.activities.length > 1 ? ",..." : "") : "aucune activitée";
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleProductPress(item)}
      >
        <Text style={styles.itemTitre}>{enterpriseName}</Text>
        <Text style={styles.itemText}>{activity}</Text>
        <View style={{ height: 20 }} />
        <Text style={styles.itemAddr}>{addr["house_number"]} rue {addr.street} {addr.municipality} {addr.zipcode}</Text>
      </TouchableOpacity>
    );
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      handleSearch(page + 1);
    }
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
        <TouchableOpacity style={styles.searchButton} onPress={() => handleSearch(1)}>
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Dropdown for selecting search type */}
      <View style={styles.dropdownContainer}>
        {renderLabel()}
        <Dropdown
          style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          data={Type}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={!isFocus ? 'Choissisez un element' : '...'}
          searchPlaceholder="Rechercher..."
          value={value}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={item => {
            setValue(item.value);
            setIsFocus(false);
          }}
          renderLeftIcon={() => (
            <AntDesign
              style={styles.icon}
              color={isFocus ? 'blue' : 'black'}
              name="Safety"
              size={20}
            />
          )}
        />
      </View>

      {/* FlatList for displaying search results */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isLoading ? <ActivityIndicator size="large" color="#42a5f5" /> : null}
        ListEmptyComponent={!isLoading && filteredData.length === 0 ? <Text style={styles.noResultsText}>Aucun résultat trouvé</Text> : null}
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
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdown: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#999',
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  label: {
    position: 'absolute',
    backgroundColor: '#fff',
    left: 22,
    top: -8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#999',
  },
  icon: {
    marginRight: 10,
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
  itemTitre: {
    fontSize: 16,
    textAlign: 'center',
    color: 'red',
  },
  itemText: {
    fontSize: 16,
  },
  itemAddr: {
    fontSize: 10,
    color: 'gray',
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    color: '#666',
  },
});

export default SearchScreen;
