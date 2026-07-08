// screens/CreatePost/components/ModerationOverlay.jsx

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ModerationOverlay = ({ visible, progress, mediaType }) => {
    if (!visible) return null;

    return (
        <Modal transparent animationType="fade" visible={visible}>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <Icon name="security" size={32} color="#2196F3" />
                    <Text style={styles.title}>Checking Content Safety</Text>
                    <Text style={styles.subtitle}>
                        {mediaType === 'video'
                            ? `Scanning video frames... ${progress
                                ? `(${progress.current}/${progress.total})`
                                : ''
                            }`
                            : 'Analyzing image...'}
                    </Text>

                    {/* Progress Bar */}
                    {progress && (
                        <View style={styles.progressBg}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${(progress.current / progress.total) * 100
                                            }%`,
                                    },
                                ]}
                            />
                        </View>
                    )}

                    <ActivityIndicator
                        size="small"
                        color="#2196F3"
                        style={{ marginTop: 12 }}
                    />
                    <Text style={styles.hint}>
                        This keeps our community safe
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 28,
        width: '80%',
        alignItems: 'center',
        elevation: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        marginTop: 12,
        marginBottom: 6,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 13,
        color: '#555',
        textAlign: 'center',
        marginBottom: 14,
    },
    progressBg: {
        width: '100%',
        height: 6,
        backgroundColor: '#E3F2FD',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#2196F3',
        borderRadius: 3,
    },
    hint: {
        fontSize: 11,
        color: '#aaa',
        marginTop: 10,
        textAlign: 'center',
    },
});

export default ModerationOverlay;