// screens/ProfileScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { logout } from '../utils/auth';
import FetchService from '../utils/fetch';

// Define the Profile screen
const ProfileTab = ({ logoutHandler }) => {
  const navigation = useNavigation();
  const [data, setData] = React.useState({});
  const [edit, setEdit] = React.useState(false);
  const [newData, setNewData] = React.useState({});

  const userData = async () => {
    try {
      const user = JSON.parse(await AsyncStorage.getItem('user'));
      if (user) {
        setData({
          mail: user.email,
          'mot de passe': user.password,
          pseudo: user.resultat.user.name,
        });
        setNewData({
          mail: user.email,
          'mot de passe': user.password,
          pseudo: user.resultat.user.name,
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l’historique', error);
    }
  };

  useEffect(() => {
    userData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      logoutHandler();
      navigation.navigate('Login'); // Replace 'Login' with the actual route name for your login screen
    } catch (e) {
      console.log('Logout failed', e);
    }
  };

  const handleEdit = () => {
    setEdit(!edit);
    // When entering edit mode, save current data
    if (!edit) {
      setNewData(data);
    }
  };

  const handleChange = (key, value) => {
    setNewData(prevData => ({
      ...prevData,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const r=JSON.parse(await AsyncStorage.getItem('user')).resultat
      const userId = r.user['_id'];
      resultat=await FetchService.put(`/api/user/${userId}`, JSON.stringify({"email":newData.mail,'password':newData["mot de passe"],'name':newData.pseudo,}),r.token);
      if (resultat!=null) {
        setData(newData);
        setEdit(false);
        
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Profile Icon */}
      <View style={styles.profileIconContainer}>
        <Ionicons name="person-circle" size={100} color="#42a5f5" />
      </View>
      <Text style={styles.title}>Profil de l'utilisateur</Text>

      {/* Additional Profile Information */}
      <Text style={styles.subtitle}>Informations de l'Utilisateur</Text>
      {Object.entries(data).map(([key, value]) => (
        <View key={key}>
            <Text style={styles.info}>{key}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={key}
              value={newData[key] || value}
              onChangeText={(text) => handleChange(key, text)}
              autoCapitalize="none"
              editable={edit}
            />
        </View>
      ))}
      {edit ? (
        <>
          <TouchableOpacity style={styles.editButton} onPress={handleSave}>
            <Text style={styles.editButtonText}>Sauvegarder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Text style={styles.editButtonText}>Annuler</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Text style={styles.editButtonText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Se Déconnecter</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};
const HistoryTab = () => {
    const [searchHistory, setSearchHistory] = React.useState([]);
  
    const fetchSearchHistory = async () => {
      try {
        const history = await AsyncStorage.getItem('searchHistory');
        if (history) {
          setSearchHistory(JSON.parse(history));
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l’historique', error);
      }
    };
  

    useFocusEffect(
        React.useCallback(() => {
          fetchSearchHistory();
        }, [])
      );


  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('searchHistory');
      setSearchHistory([]);
    } catch (error) {
      console.error('Erreur lors du nettoyage de l’historique', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Historique de recherche</Text>
      {searchHistory.length > 0 ? (
        <FlatList
          data={searchHistory}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.historyItemContainer}>
              <Text style={styles.historyItem}>{item}</Text>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noHistory}>Aucun historique disponible</Text>
      )}
      {searchHistory.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
            <Text style={styles.clearButtonText}>Supprimer</Text>
          </TouchableOpacity>
        )}
    </View>
  );
};

const FavorisTab = ({ navigation }) => {
  const [favoris, setFavoris] = React.useState([]);

  const fetchFavoris = async () => {
    try {
      const history = await AsyncStorage.getItem('favoris');
      console.log(history);
      
      if (history) {
        setFavoris(JSON.parse(history));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des favoris', error);
    }
  };
  

  useFocusEffect(
    React.useCallback(() => {
        fetchFavoris();
    }, [])
  );

  const deleteItem = async (item) => {
    try {
      const updatedFavoris = favoris.filter(favori => favori !== item);
      await AsyncStorage.setItem('favoris', JSON.stringify(updatedFavoris));
      setFavoris(updatedFavoris);
    } catch (error) {
      console.error('Erreur lors de la suppression de l’élément', error);
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      "Supprimer le favori",
      "Êtes-vous sûr de vouloir supprimer cet élément des favoris ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", onPress: () => deleteItem(item) }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Liste de souhaits</Text>
      {favoris.length > 0 ? (
        <FlatList
          data={favoris}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.historyItemContainer}>
              <Text style={styles.historyItem} onPress={()=>navigation.navigate('Enterprise', { enterprise: item })}>{item.denominations ? (item.denominations[1] ? item.denominations[1].denomination : item.denominations[0].denomination) : item["entity_number"]}</Text>
              <TouchableOpacity onPress={() => handleDelete(item)}>
                <Ionicons name="trash-bin" size={24} color="red" />
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noHistory}>Aucun Favoris disponible</Text>
      )}
    </View>
  );
};

// Create Top Tab Navigator
const Tab = createMaterialTopTabNavigator();

const ProfileScreen = ({logoutHandler}) => {
  return (
    <Tab.Navigator>
    <Tab.Screen name="Profil">
    {props => <ProfileTab {...props} logoutHandler={logoutHandler} />}
  </Tab.Screen>
      <Tab.Screen name="Favoris" component={FavorisTab} />
      <Tab.Screen name="History" component={HistoryTab} />
    </Tab.Navigator>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  profileIconContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  info: {
    fontSize: 16,
    marginBottom: 5,
  },
  historyItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  historyItem: {
    flex: 1,
    fontSize: 16,
  },
  noHistory: {
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  clearButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: '#3399ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ProfileScreen;
