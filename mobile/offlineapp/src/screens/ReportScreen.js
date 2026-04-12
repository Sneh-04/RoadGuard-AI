import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../context/AppContext';
import cameraService from '../services/cameraService';
import locationService from '../services/locationService';
import database from '../services/database';

const ReportScreen = () => {
  const {
    addComplaint,
    currentLocation,
    isOnline,
    syncStats,
  } = useAppContext();

  const cameraRef = useRef(null);
  const [description, setDescription] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handleCapturePhoto = async () => {
    try {
      if (!cameraRef.current) {
        Alert.alert('Error', 'Camera not ready');
        return;
      }

      setLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      const savedPath = await cameraService.saveImage(photo.uri, 'temp');
      const base64 = `data:image/jpeg;base64,${photo.base64}`;

      setCapturedImage({
        uri: savedPath,
        base64,
      });

      setShowCamera(false);
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    try {
      if (!description.trim()) {
        Alert.alert('❌ Missing Info', 'Please describe the hazard you found', [{ text: 'OK' }]);
        return;
      }

      if (!currentLocation) {
        Alert.alert('📍 No GPS', 'Location not available. Please enable GPS and try again.', [{ text: 'OK' }]);
        return;
      }

      setLoading(true);

      const complaintData = {
        user_id: 'mobile_user',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`,
        description,
        image: capturedImage?.base64 || null,
        status: 'Pending',
        priority: 'Low',
      };

      const complaint = await addComplaint(complaintData);

      if (capturedImage) {
        await database.insertImage(complaint.id, capturedImage.uri, capturedImage.base64);
      }

      // Show success with different message based on online status
      const offlineMsg = isOnline
        ? '✅ Report submitted!\n\nSyncing to server now...'
        : '💾 Report saved locally!\n\nWill sync automatically when online ⚡';

      console.log(`[REPORT] Submitted report - Online: ${isOnline}, Status: ${isOnline ? 'SYNCING' : 'QUEUED'}`);

      // Reset form
      setDescription('');
      setCapturedImage(null);

      Alert.alert(
        isOnline ? '🚀 Online' : '📱 Offline',
        offlineMsg,
        [
          {
            text: 'Go to History',
            onPress: () => {
              console.log('[REPORT] User navigating to History to view submission');
            },
          },
          {
            text: 'OK',
            onPress: () => {},
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('❌ Error', 'Failed to submit report. Please try again.', [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setCapturedImage(null);
  };

  if (showCamera) {
    return (
      <View style={styles.container}>
        <RNCamera
          ref={cameraRef}
          style={styles.camera}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.on}
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
        >
          <View style={styles.cameraButtonContainer}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handleCapturePhoto}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <Ionicons name="camera" size={32} color="#fff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </RNCamera>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Network Status */}
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: isOnline ? '#4CAF50' : '#FF9800' },
          ]}
        >
          <Ionicons
            name={isOnline ? 'wifi' : 'wifi-outline'}
            size={16}
            color="#fff"
          />
          <Text style={styles.statusText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        {/* Pending Uploads */}
        {syncStats.pending > 0 && (
          <View style={styles.pendingBanner}>
            <Ionicons name="cloud-upload" size={20} color="#FF9800" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.pendingTitle}>Pending Uploads</Text>
              <Text style={styles.pendingText}>
                {syncStats.pending} report{syncStats.pending > 1 ? 's' : ''} waiting
                to sync
              </Text>
            </View>
          </View>
        )}

        {/* Location Display */}
        {currentLocation && (
          <View style={styles.locationBox}>
            <Ionicons name="location" size={20} color="#007AFF" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.label}>Current Location</Text>
              <Text style={styles.locationText}>
                {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </Text>
              <Text style={styles.accuracyText}>
                Accuracy: ±{Math.round(currentLocation.accuracy)}m
              </Text>
            </View>
          </View>
        )}

        {/* Description Input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Describe the hazard (e.g., pothole, broken road, debris)"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Image Capture */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Photo</Text>
          {capturedImage ? (
            <View>
              <Image
                source={{ uri: capturedImage.uri }}
                style={styles.imagePreview}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.cameraButtonSmall}
              onPress={() => setShowCamera(true)}
            >
              <Ionicons name="camera" size={32} color="#007AFF" />
              <Text style={styles.cameraButtonText}>Take Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmitReport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            Your report will be saved locally and automatically synced to the
            server when internet is available.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  pendingBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  pendingTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  pendingText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  locationBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  locationText: {
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  accuracyText: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
  },
  cameraButtonSmall: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 50,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cameraButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 32,
    gap: 16,
  },
  cameraButton: {
    backgroundColor: '#007AFF',
    borderRadius: 50,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 32,
  },
  infoText: {
    color: '#1565C0',
    marginLeft: 12,
    flex: 1,
    fontSize: 13,
  },
});

export default ReportScreen;
