# Deep Linking Setup Guide

## App Configuration ✅

Deep linking ab app mein properly configured hai. Jab koi user `https://autofinder.pk` ke link par click kare, to:

1. **Agar app installed hai** → App automatically open ho jayega aur property detail screen show hogi
2. **Agar app installed nahi hai** → Browser mein website open ho jayegi

## App Side Setup (Already Done) ✅

### 1. app.json Configuration
- `scheme: "autofinder"` - Custom URL scheme add kiya gaya
- iOS `associatedDomains` - Universal links ke liye
- Android `intentFilters` - App links ke liye

### 2. App.tsx Deep Link Handling
- NavigationContainer mein linking configuration add ki
- URL parsing aur navigation handling implement ki

## Website Side Setup (Required)

Website developers ko yeh setup karna hoga:

### Option 1: Smart App Banner (Recommended for iOS)

Website ke `<head>` section mein add karein:

```html
<meta name="apple-itunes-app" content="app-id=YOUR_APP_ID">
```

### Option 2: JavaScript Detection (For Android & iOS)

Website par yeh code add karein:

```javascript
// Check if app is installed
function openInApp(url) {
  const appScheme = 'autofinder://';
  const appUrl = url.replace('https://autofinder.pk/', appScheme);
  
  // Try to open app
  window.location.href = appUrl;
  
  // If app doesn't open in 2 seconds, show options
  setTimeout(() => {
    const userChoice = confirm(
      'App installed nahi hai. Kya aap chahte hain:\n\n' +
      'OK - Website par continue karein\n' +
      'Cancel - Google Play Store se app download karein'
    );
    
    if (!userChoice) {
      // Open Play Store
      window.open('https://play.google.com/store/apps/details?id=com.adeel360.autofinder', '_blank');
    }
  }, 2000);
}

// Usage
document.querySelectorAll('a[href^="https://autofinder.pk/"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    openInApp(e.target.href);
  });
});
```

### Option 3: Smart Banner with Download Option

```html
<div id="app-banner" style="display: none; position: fixed; bottom: 0; width: 100%; background: #CD0100; color: white; padding: 15px; text-align: center; z-index: 9999;">
  <p style="margin: 0 0 10px 0;">Better experience ke liye app download karein!</p>
  <div>
    <a href="https://play.google.com/store/apps/details?id=com.adeel360.autofinder" 
       style="color: white; text-decoration: underline; margin-right: 20px;">
      Download App
    </a>
    <button onclick="document.getElementById('app-banner').style.display='none'" 
            style="background: white; color: #CD0100; border: none; padding: 5px 15px; border-radius: 5px; cursor: pointer;">
      Close
    </button>
  </div>
</div>

<script>
// Show banner on mobile devices
if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  document.getElementById('app-banner').style.display = 'block';
}
</script>
```

## Supported URL Formats

App ab in URLs ko handle karega:

- `https://autofinder.pk/car/[id]` → Car details
- `https://autofinder.pk/bike/[id]` → Bike details
- `https://autofinder.pk/rental-car/[id]` → Rental car details
- `https://autofinder.pk/new-car/[id]` → New car details
- `https://autofinder.pk/new-bike/[id]` → New bike details
- `https://autofinder.pk/auto-part/[id]` → Auto parts details

Custom scheme:
- `autofinder://car/[id]`
- `autofinder://bike/[id]`
- etc.

## Testing

1. **App installed ke saath test:**
   - Browser mein `https://autofinder.pk/car/[id]` open karein
   - App automatically open honi chahiye

2. **App installed nahi hai:**
   - Browser mein website open hogi
   - Smart banner ya download option show hoga

## Notes

- Android ke liye Play Store link: `https://play.google.com/store/apps/details?id=com.adeel360.autofinder`
- iOS ke liye App Store link add karein jab app store par upload ho jaye
- Universal links ke liye website par `.well-known/apple-app-site-association` file bhi add karni hogi (iOS ke liye)

