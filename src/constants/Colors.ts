export const Colors = {
    // Shared Colors
    secondary: '#D4AF37', // Gold
    accent: '#74C69D',    // Greenish
    error: '#FF4D4D',
    white: '#FFFFFF',
    black: '#000000',

    // Dark Theme
    dark: {
        background: '#081C15',
        surface: '#1B4332',
        surfaceLight: '#2D6A4F',
        text: '#FFFFFF',
        textMuted: '#B7D1C4',
        border: 'rgba(212, 175, 55, 0.2)',
    },

    // Light Theme (Premium Parchment)
    light: {
        background: '#EFEDE4', // Warm Classic Parchment
        surface: '#FAF9F6',    // Soft Ivory Surface (Not pure white)
        surfaceLight: '#E5E1D1', // Aged Paper Tone
        text: '#081C15',        // Deep Emerald Black
        textMuted: '#6B705C',   // Olive Gray (Muted)
        border: 'rgba(8, 28, 21, 0.08)',
    }
};

export const Shadows = {
    light: {
        shadowColor: '#4A4230', // Warm Umber Shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
};
