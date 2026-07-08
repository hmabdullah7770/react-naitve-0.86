import React, { useState } from 'react';
import {
    View,
    Button,
    Image,
    FlatList,
    Text,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import {
    useVideoFrames,
    extractFrameAtTime,
    getVideoMetadata,
} from './index';

// ─────────────────────────────────────────────
// Example 1: Hook Usage
// ─────────────────────────────────────────────

export function VideoFramesExample() {
    const { frames, isLoading, error, progress, extract } = useVideoFrames({
        frameCount: 12,
        quality: 75,
        width: 320,
        format: 'jpeg',
        onProgress: (e) => console.log(`Progress: ${e.current}/${e.total}`),
    });

    const videoPath =
        '/storage/emulated/0/DCIM/Camera/video.mp4';

    return (
        <View style={styles.container}>
            <Button
                title="Extract Frames"
                onPress={() => extract(videoPath)}
            />

            {isLoading && (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" />
                    {progress && (
                        <Text>
                            {progress.current} / {progress.total}
                        </Text>
                    )}
                </View>
            )}

            {error && (
                <Text style={styles.error}>{error.message}</Text>
            )}

            <FlatList
                data={frames}
                numColumns={3}
                keyExtractor={(item) => item.uri}
                renderItem={({ item }) => (
                    <View style={styles.frameContainer}>
                        <Image
                            source={{ uri: item.uri }}
                            style={styles.frame}
                        />
                        <Text style={styles.timestamp}>
                            {(item.timestamp / 1000).toFixed(1)}s
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}

// ─────────────────────────────────────────────
// Example 2: Direct API Usage
// ─────────────────────────────────────────────

export function SingleFrameExample() {
    const [frame, setFrame] = useState < string | null > (null);

    const handleExtract = async () => {
        try {
            // Get metadata first
            const meta = await getVideoMetadata('/path/to/video.mp4');
            console.log('Duration:', meta.duration, 'ms');

            // Extract frame at 5 seconds
            const result = await extractFrameAtTime(
                '/path/to/video.mp4',
                5000,
                { quality: 90, width: 640, format: 'jpeg' }
            );

            setFrame(result.uri);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <View>
            <Button title="Get Frame at 5s" onPress={handleExtract} />
            {frame && (
                <Image
                    source={{ uri: frame }}
                    style={{ width: 320, height: 180 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    loading: { alignItems: 'center', padding: 20 },
    error: { color: 'red', padding: 8 },
    frameContainer: { flex: 1 / 3, margin: 2 },
    frame: { width: '100%', aspectRatio: 16 / 9 },
    timestamp: {
        textAlign: 'center',
        fontSize: 10,
        color: '#666',
    },
});