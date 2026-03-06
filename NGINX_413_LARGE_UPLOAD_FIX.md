# Fix 413 Request Entity Too Large (Large Image Upload)

When users get **413 Request Entity Too Large** from nginx while posting ads (car, bike, auto parts, etc.), the server’s nginx limit for request body size is too low.

---

## Apply on your server

### 1. Edit nginx config

On the server where **backend.autofinder.pk** is hosted:

```bash
sudo nano /etc/nginx/sites-available/autofinder-backend
```

(If you use a different path, e.g. `/etc/nginx/conf.d/autofinder.conf`, edit that file.)

### 2. Set body size limit

Inside the `server { ... }` block (for both HTTP and HTTPS if you have both), add or update:

```nginx
client_max_body_size 100M;
client_body_buffer_size 256k;
```

- Put it near the top of the `server` block (e.g. after `server_name`).
- If you already have `client_max_body_size 50M;`, change it to `100M`.

**HTTPS server block:**  
If you have a separate `server { listen 443 ssl; ... }` block, add the same two lines there as well.

### 3. (Optional) Limit only for upload paths

To allow large uploads only on ad/upload routes, add a location like this (and keep `client_max_body_size` in the server block as above):

```nginx
location ~ ^/(free_ads|featured_ads|bike_ads|rent_car|autoparts|list_it_for_you_ad|signup|edit-profile-pic|payment|inspection|buy_car-for_me|blogs|videos|advertising) {
    client_max_body_size 100M;
    # ... rest of your proxy_pass and headers for this location
}
```

### 4. Test and reload nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Summary

| Setting                  | Value   | Purpose                          |
|--------------------------|---------|----------------------------------|
| `client_max_body_size`   | `100M`  | Allow large image uploads        |
| `client_body_buffer_size` | `256k` | Buffer for large request bodies  |

After this, users should be able to upload multiple/large images for car ads, bike ads, auto parts, etc. without getting 413 from nginx.
