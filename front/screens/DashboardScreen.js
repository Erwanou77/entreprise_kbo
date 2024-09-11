import React, { useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet, FlatList, BackHandler } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Ionicons from 'react-native-vector-icons/Ionicons';

const chartData = {
  labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
  datasets: [
    {
      data: [120, 190, 85, 300, 250, 400],
    },
  ],
};

const dataTable = [
  { id: '1', name: 'Produit A', quantity: '100', price: '$120' },
  { id: '2', name: 'Produit B', quantity: '80', price: '$90' },
  { id: '3', name: 'Produit C', quantity: '150', price: '$200' },
  { id: '4', name: 'Produit D', quantity: '60', price: '$70' },
];

const DashboardScreen = ({ navigation }) => {
  useEffect(() => {
    // Define the back button handler
    const backAction = () => {
      return true; // Prevent default back action
    };

    // Add event listener
    BackHandler.addEventListener('hardwareBackPress', backAction);

    // Clean up the event listener
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', backAction);
  }, []);

  const renderItem = ({ item }) => {
    if (item.type === 'chart') {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Statistiques de Vente</Text>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 40}
            height={220}
            yAxisLabel="$"
            yAxisSuffix="k"
            yAxisInterval={1}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#41a4fa',
              backgroundGradientTo: '#1d4ed8',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#ff384c',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      );
    } else if (item.type === 'table') {
      return (
        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>Tableau des Produits</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.headerText}>Produit</Text>
            <Text style={styles.headerText}>Quantité</Text>
            <Text style={styles.headerText}>Prix</Text>
          </View>
          {dataTable.map((row) => (
            <View key={row.id} style={styles.tableRow}>
              <Text style={styles.cellText}>{row.name}</Text>
              <Text style={styles.cellText}>{row.quantity}</Text>
              <Text style={styles.cellText}>{row.price}</Text>
            </View>
          ))}
        </View>
      );
    }
    return null;
  };

  return (
    <FlatList
      data={[
        { id: '1', type: 'chart' },
        { id: '2', type: 'table' },
      ]}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: '600',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  tableContainer: {
    width: '100%',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tableTitle: {
    fontSize: 18,
    marginVertical: 20,
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  headerText: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  cellText: {
    flex: 1,
    textAlign: 'center',
  },
});

export default DashboardScreen;
