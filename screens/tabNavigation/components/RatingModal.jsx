import React from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Text,
    Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFavouret } from '../../../ReactQuery/TanStackQueryHooks/useFavouret'
import { AppState } from 'react-native';
import { useRating} from '../../../ReactQuery/TanStackQueryHooks/useRating'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const RatingModal = ({ visible, onClose, onSelectRating }) => {
    if (!visible) return null;

    const ratingReactions = [
        
        { value: 1, emoji: '🙂' },
        { value: 2, emoji: '👍' },
        { value: 3, emoji: '🙌' },
        { value: 4, emoji: '🔥' },
        { value: 5, emoji: '💯' },
    ];

    return (
        <>
            {/* 1. Backdrop overlay to catch clicks outside the popup to close it */}
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={onClose}
            />

            {/* 2. Floating Rating Bar container */}
            <View style={styles.popupContainer}>

               {/* Grey star at the start */}
                <TouchableOpacity
                    style={styles.starWrapper}
                    onPress={() => onSelectRating(0)}
                    activeOpacity={0.7}
                >
                    <Icon name="star" size={32} color="#C0C0C0" />
                </TouchableOpacity>


                {ratingReactions.map((reaction) => (
                    <TouchableOpacity
                        key={reaction.value}
                        style={styles.starWrapper}
                        onPress={() => onSelectRating(reaction.value)}
                        activeOpacity={0.7}
                    >
                        <Icon name="star" size={32} color="#FFB800" />
                        <View style={styles.emojiBadge}>
                            <Text style={styles.emojiText}>{reaction.emoji}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </>
    );
};

export default RatingModal;

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        // Huge dimensions to ensure it covers the entire screen area around the post 
        top: -SCREEN_HEIGHT,
        bottom: -SCREEN_HEIGHT,
        left: -SCREEN_WIDTH,
        right: -SCREEN_WIDTH,
        backgroundColor: 'transparent',
        zIndex: 99,
    },
    popupContainer: {
        position: 'absolute',
        bottom: 55, // Positions it precisely right above the bottom bar
        left: 15,
        right: 15,
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 30, // Pill shape
        // iOS Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        // Android Shadow
        elevation: 10,
        zIndex: 100,
    },
    starWrapper: {
        position: 'relative',
        marginHorizontal: 4,
    },
    emojiBadge: {
        position: 'absolute',
        bottom: -4,
        right: -6,
        backgroundColor: 'white',
        borderRadius: 17,
        padding: 1,
    },
    emojiText: {
        fontSize: 15,
    },
});