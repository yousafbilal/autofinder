#!/bin/bash

# Fix expo-linear-gradient JSX syntax error
PACKAGE_PATH="node_modules/expo-linear-gradient/build/LinearGradient.js"

if [ -f "$PACKAGE_PATH" ]; then
    echo "Fixing expo-linear-gradient package..."
    
    # Replace JSX syntax with React.createElement
    sed -i.bak 's/return (<NativeLinearGradient {...props} colors={Platform.select({/return React.createElement(NativeLinearGradient, {...props, colors: Platform.select({/g' "$PACKAGE_PATH"
    sed -i.bak 's/})} dither={Platform.select({ android: dither })} locations={resolvedLocations} startPoint={_normalizePoint(start)} endPoint={_normalizePoint(end)}\/>);/}), dither: Platform.select({ android: dither }), locations: resolvedLocations, startPoint: _normalizePoint(start), endPoint: _normalizePoint(end)});/g' "$PACKAGE_PATH"
    
    echo "expo-linear-gradient package fixed!"
else
    echo "Warning: expo-linear-gradient package not found at $PACKAGE_PATH"
fi
