import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet, Image, Modal, TouchableOpacity } from 'react-native';
import { BackHandler } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImageViewer from 'react-native-image-zoom-viewer';

const DashboardScreen = ({ navigation }) => {
  const [isZoomModalVisible, setZoomModalVisible] = useState(false);
  const [image, setImage] = useState([]);

  useEffect(() => {
    const backAction = () => {
      return true; // Prevent default back action
    };

    BackHandler.addEventListener('hardwareBackPress', backAction);
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', backAction);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>Statistiques des Entreprises</Text>

      {/* Add TouchableOpacity to open modal with zoomable image */}
      <TouchableOpacity onPress={() => {setImage([
    {
      url: '', // URL can be left empty when using a local image
      props: {
        source: require('../image/activity.gif'), // Your local gif path
      },
    },
  ]);
  setZoomModalVisible(true)}}>
        <Image
          source={require('../image/activity.gif')}
          style={styles.gif}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => {setImage([
    {
      url: '', // URL can be left empty when using a local image
      props: {
        source: require('../image/activity2.gif'), // Your local gif path
      },
    },
  ]);
  setZoomModalVisible(true)}}>
        <Image
          source={require('../image/activity2.gif')}
          style={styles.gif}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Zoomable Image Modal */}
      <Modal visible={isZoomModalVisible} transparent={true}>
        <ImageViewer
          imageUrls={image}
          enableSwipeDown={true}
          onSwipeDown={() => setZoomModalVisible(false)} // Close modal on swipe down
          renderIndicator={() => null} // Disable image index indicator
        />
        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setZoomModalVisible(false)}
        >
          <Ionicons name="close-circle" size={40} color="white" />
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  gif: {
    width: Dimensions.get('window').width - 40,
    height: (Dimensions.get('window').width - 40) * 0.56,
    marginVertical: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
});

export default DashboardScreen;
