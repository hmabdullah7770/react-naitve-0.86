import React from 'react';
import FastImage from '@d11/react-native-fast-image';

const FastImageOrImage = React.forwardRef(({ source, style, resizeMode = 'cover', ...rest }, ref) => {
  return <FastImage ref={ref} source={source} style={style} resizeMode={resizeMode} {...rest} />;
});

FastImageOrImage.displayName = 'FastImageOrImage';
export default React.memo(FastImageOrImage);