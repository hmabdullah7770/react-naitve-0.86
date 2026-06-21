# Automatic Video Thumbnail Generation Service

This service automatically extracts thumbnails from video files when users don't provide custom thumbnails during post creation.

## Features

- **Automatic Detection**: Analyzes FormData to find videos without corresponding thumbnails
- **Center Frame Extraction**: Extracts thumbnails from the center of videos (50% duration)
- **Fallback Strategy**: Uses multiple timestamps if primary extraction fails
- **Compression & Optimization**: Compresses thumbnails to optimal size (max 2MB, 1920x1080)
- **Local Storage Management**: Stores thumbnails temporarily and cleans up after API responses
- **Configurable**: Easy to enable/disable and configure settings
- **Error Handling**: Graceful error handling that doesn't break post creation

## Usage

### Basic Integration

The service is automatically integrated into the post creation workflow in `CreatepostScreen.js`:

```javascript
// Import the service
const {default: ThumbnailCreationService} = await import(
  './services/thumbnailservices/thumbnailCreation'
);

// Process FormData before API submission
const enhancedFormData = await ThumbnailCreationService.processFormData(formData);

// Use enhanced FormData for API call
dispatch(uploadpostrequest(enhancedFormData));
```

### Configuration

```javascript
// Enable/disable the service
ThumbnailCreationService.setEnabled(true);

// Update configuration
ThumbnailCreationService.updateConfig({
  THUMBNAIL_QUALITY: 0.8,
  MAX_THUMBNAIL_SIZE: 2 * 1024 * 1024, // 2MB
  EXTRACTION_TIMEOUT: 30000, // 30 seconds
});

// Get current configuration
const config = ThumbnailCreationService.getConfig();

// Reset to defaults
ThumbnailCreationService.resetConfig();
```

### Manual Cleanup

```javascript
// Cleanup after API response (automatically handled in Redux saga)
await ThumbnailCreationService.cleanup(null, apiSuccess);

// Startup cleanup for orphaned files
await ThumbnailCreationService.startupCleanup();

// Cleanup old files (older than 24 hours)
await ThumbnailCreationService.cleanupOldFiles();
```

## How It Works

1. **FormData Analysis**: The service analyzes FormData to identify video fields (`videoFile1`, `videoFile2`, etc.) that don't have corresponding thumbnail fields (`thumbnail1`, `thumbnail2`, etc.)

2. **Thumbnail Extraction**: For each video without a thumbnail:
   - Extracts frame from center of video (50% duration)
   - Falls back to 25% and 75% if center extraction fails
   - Compresses and optimizes the extracted image

3. **FormData Enhancement**: Adds generated thumbnails to FormData with correct field names

4. **Cleanup**: After API response (success or failure), automatically deletes temporary thumbnail files

## File Structure

```
thumbnailservices/
├── thumbnailCreation.js      # Main service class
├── FormDataAnalyzer.js       # Analyzes FormData for videos/thumbnails
├── ThumbnailExtractor.js     # Handles video frame extraction
└── README.md                 # This documentation
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ENABLE_AUTO_THUMBNAILS` | boolean | `true` | Enable/disable the service |
| `THUMBNAIL_QUALITY` | number | `0.8` | JPEG compression quality (0-1) |
| `MAX_THUMBNAIL_SIZE` | number | `2MB` | Maximum thumbnail file size |
| `MAX_RESOLUTION` | object | `{width: 1920, height: 1080}` | Maximum thumbnail dimensions |
| `EXTRACTION_TIMEOUT` | number | `30000` | Timeout for extraction (ms) |
| `CLEANUP_INTERVAL` | number | `24 hours` | Auto-cleanup interval |
| `TEMP_DIR_NAME` | string | `'auto_thumbnails'` | Temporary directory name |
| `PRIMARY_TIMESTAMP_RATIO` | number | `0.5` | Primary extraction point (50%) |
| `FALLBACK_TIMESTAMPS` | array | `[0.25, 0.75]` | Fallback extraction points |

## Error Handling

The service is designed to fail gracefully:

- If thumbnail extraction fails, the post creation continues without thumbnails
- Individual video extraction failures don't affect other videos
- Cleanup errors don't break the main workflow
- All errors are logged for debugging

## Dependencies

- `react-native-create-thumbnail`: Video frame extraction
- `react-native-compressor`: Image compression and optimization
- `react-native-fs`: File system operations

## Debugging

Enable detailed logging in development:

```javascript
// Log service status
ThumbnailCreationService.logStatus();

// Log FormData analysis
FormDataAnalyzer.logAnalysis(formData);
```

## Disabling the Service

To disable automatic thumbnail generation (e.g., for backend processing):

```javascript
// Disable the service
ThumbnailCreationService.setEnabled(false);

// Or update configuration
ThumbnailCreationService.updateConfig({
  ENABLE_AUTO_THUMBNAILS: false
});
```

When disabled, the service returns the original FormData unchanged.