import React from 'react';
import FastImage from '@d11/react-native-fast-image';

const FastImageOrImage = React.forwardRef(({ source, style, resizeMode = 'cover', ...rest }, ref) => {
  console.log('🖼️ RENDERING IMAGE:', JSON.stringify(source));
  return <FastImage
  
  source={source}
  ref={ref}
  style={style}
  resizeMode={resizeMode}
  onLoadStart={() => console.log('🟡 LOAD START', source.uri)}
  onProgress={(e) => console.log('🔵 PROGRESS', e.nativeEvent)}
  onLoad={(e) => console.log('🟢 LOADED', e.nativeEvent)}
  onError={(e) => console.log('🔴 ERROR', e.nativeEvent, source.uri)}
  {...rest}
/>
});

FastImageOrImage.displayName = 'FastImageOrImage';
export default React.memo(FastImageOrImage);